/* eslint-disable */
/**
 * 生成带多信息的水印（姓名、电话、时间、项目）
 * @param {string} className - 目标容器的 class 名称
 * @param {Object} options - 水印配置（含用户信息）
 *   - name: 姓名
 *   - phone: 电话号码
 *   - project: 项目名称
 *   - text: 额外说明文字（可选）
 *   - 其他样式配置（fontSize、color、rotate等）
 */
export default function addMultiInfoWatermark(className, options) {
  if (options.hideWatermark) return
  const containers = document.getElementsByClassName(className);
  if (containers.length === 0) {
    console.warn(`未找到 class 为 ${className} 的容器`);
    return;
  }

  const { name, phone, project, isCopyable } = options;
  function padZero(num) {
    return num < 10 ? `0${num}` : `${num}`;
  }
  function formatCurrentTime() {
    const date = new Date();
    const year = date.getFullYear(); // 年份（四位）
    const month = padZero(date.getMonth() + 1); // 月份（0-11 → 1-12，补零）
    const day = padZero(date.getDate()); // 日期（1-31，补零）
    const hours = padZero(date.getHours()); // 小时（0-23，补零）
    const minutes = padZero(date.getMinutes()); // 分钟（0-59，补零）
    const seconds = padZero(date.getSeconds()); // 秒（0-59，补零）
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  // 水印文本内容（分行显示，每行一个信息）
  const watermarkLines = [];
  if (project) watermarkLines.push(project)
  if (name) watermarkLines.push(name)
  if (phone) watermarkLines.push(phone)
  watermarkLines.push(formatCurrentTime())


  // 3. 遍历容器，逐个添加水印
  Array.from(containers).forEach(container => {
    // 添加禁止复制拷贝功能
    if (!isCopyable) {
        const currentClass = containers[containers.length -1].getAttribute('class') || '';
        containers[containers.length -1].setAttribute('class', currentClass + ' disableCopy');
        // container.addEventListener('copy', (e) => {
        //     e.preventDefault();
        // });
        // container.addEventListener('cut', (e) => {
        //     e.preventDefault();
        // });
        // container.addEventListener('contextmenu', (e) => {
        //     e.preventDefault();
        // });
    }

    // 防止重复添加
    if (container.querySelector('.multi-info-watermark')) return;

    // 创建 Canvas 绘制水印
    const canvas = document.createElement('canvas');
    const unitWidth = options.width || 280; // 水印单元宽度（需容纳多行文本）
    const unitHeight = options.height || 200; // 水印单元高度
    canvas.width = unitWidth;
    canvas.height = unitHeight;
    const ctx = canvas.getContext('2d');

    // 配置水印基础样式
    ctx.rotate((options.rotate || -15) * Math.PI / 180); // 旋转角度
    ctx.font = `${options.fontSize || 14}px ${options.fontFamily || 'Microsoft YaHei'}`;
    ctx.fillStyle = options.color || 'rgba(100, 100, 100, 0.15)'; // 浅灰色半透明
    ctx.textAlign = 'center'; // 文本居中
    ctx.textBaseline = 'middle';
    
    // 多行文本绘制（计算每行位置，行间距为字体大小的1.2倍）
    const lineCount = watermarkLines.length;
    const lineHeight = (options.fontSize || 14) * 1.2; // 行高
    
    // 计算文本总高度（用于垂直居中）
    const totalTextHeight = lineHeight * (lineCount - 1); // 总行高（最后一行无行高）
    const textCenterY = totalTextHeight / 2; // 文本块自身的中心Y坐标

    const rotateAngle = (options.rotate || -15) * Math.PI / 180; // 旋转角度（弧度）
    ctx.translate(unitWidth / 2, unitHeight / 2);
    ctx.rotate(rotateAngle);
    ctx.translate(-unitWidth / 2, -unitHeight / 2);

    // 计算文本起始位置（确保在旋转后仍居中）
    // Canvas中心Y - 文本块中心Y = 起始Y坐标
    const startY = (unitHeight / 2) - textCenterY;

    // 绘制多行文本
    watermarkLines.forEach((line, index) => {
      const y = startY + (index * lineHeight); // 每行Y坐标
      ctx.fillText(line, unitWidth / 2, y); // X固定为Canvas中心（水平居中）
    });

    // 创建水印元素并添加到容器
    const watermark = document.createElement('div');
    watermark.className = 'multi-info-watermark';
    watermark.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      background-image: url(${canvas.toDataURL('image/png')});
      background-repeat: repeat;
      z-index: ${options.zIndex || 1000};
    `;

    container.appendChild(watermark);

    // 防篡改监听（水印被删除后重新添加）
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.removedNodes.forEach(node => {
        if (node === watermark) {
          observer.disconnect();
          addMultiInfoWatermark(className, options); // 重新应用水印
        }
        });
      });
    });
    observer.observe(container, { childList: true });
  });
}
