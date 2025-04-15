// إنشاء أيقونات بسيطة باستخدام Canvas
function createIcons() {
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  sizes.forEach(size => {
    // تعيين حجم Canvas
    canvas.width = size;
    canvas.height = size;
    
    // تعيين لون الخلفية
    ctx.fillStyle = '#2C786C';
    ctx.fillRect(0, 0, size, size);
    
    // رسم دائرة
    ctx.fillStyle = '#FFD166';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/3, 0, 2 * Math.PI);
    ctx.fill();
    
    // رسم رمز $
    ctx.fillStyle = '#2C786C';
    ctx.font = `bold ${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', size/2, size/2);
    
    // تحويل Canvas إلى صورة
    const iconData = canvas.toDataURL('image/png');
    
    // إنشاء عنصر صورة
    const img = document.createElement('img');
    img.src = iconData;
    
    // تنزيل الصورة
    const link = document.createElement('a');
    link.download = `icon-${size}x${size}.png`;
    link.href = iconData;
    link.click();
  });
}

// استدعاء الدالة عند تحميل الصفحة
window.addEventListener('load', createIcons);
