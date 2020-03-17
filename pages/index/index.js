Page({
  data: {
    layoutTypeList: [{
      label: '横版',
      value: 0
    }, {
      label: '竖版',
      value: 1
    }],
    layoutChosen: {
      label: '横版',
      value: 0
    }, //已选布局样式
    customzieImageOriginLocal:'', //原图本地路径
    customizeImage1: '', //合成后图片本地路径
    customizeImage2: '',
    canvas_width1: 317,
    canvas_height1: 200,
    canvas_width2: 200,
    canvas_height2: 317
  },

  /** 预览图片 */
  previewImage: function() {
    const layoutType = this.data.layoutChosen.value;
    if (this.data.customizeImage1 || this.data.customizeImage2) {
      wx.previewImage({
        urls: [layoutType == 0 ? this.data.customizeImage1 : this.data.customizeImage2]
      })
    }
  },

  // 布局类型
  layoutChange: function(e) {
    let self = this;
    const layoutTypeList = this.data.layoutTypeList;
    if (layoutTypeList) {
      layoutTypeList.forEach((item, index) => {
        if (item.label === e.detail.value) {
          self.setData({
            layoutChosen: item
          });
        }
      })
    }
  },

  // 切换封面
  changeCover: function() {
    const this_ = this;
    const layoutType = this.data.layoutChosen.value;
    var canvas_width = layoutType == 0 ? this.data.canvas_width1 : this.data.canvas_width2,
      canvas_height = layoutType == 0 ? this.data.canvas_height1 : this.data.canvas_height2;
    // 创建画布上下文 这里并不是每次都创建新的，指定ID后下次执行就获取已经创建过指定ID的对象
    const ctx = wx.createCanvasContext(layoutType == 0 ? 'myCanvas1' : 'myCanvas2', this);
    wx.chooseImage({
      count: 1, // 默认9
      success: function(data) {
        //先清空原来的画布,否则用户更换图片时上次绘制的内容还在
        ctx.draw();

        //获取图片信息，将图片按合适比例裁剪 实现aspect-fill效果 (备注：小程序中canvas.drawImage不能使用网络图片，网络图片要通过 getImageInfo / downloadFile 先下载)
        wx.getImageInfo({
          src: data.tempFilePaths[0],
          success(res) {
            console.log(res.width, res.height);

            // 先绘制圆角
            this_.roundRect(ctx, 0, 0, canvas_width, canvas_height, 10);

            // 图片裁剪逻辑
            let img_width = res.width,
              img_height = res.height;

            let clip_left, clip_top, //左偏移值，上偏移值，
              clip_width, clip_height; //截取宽度，截取高度

            clip_height = img_width * (canvas_height / canvas_width);
            if (clip_height > img_height) {
              clip_height = img_height;
              clip_width = clip_height * (canvas_width / canvas_height);
              clip_left = (img_width - clip_width) / 2;
              clip_top = 0;
            } else {
              clip_left = 0;
              clip_top = (img_height - clip_height) / 2;
              clip_width = img_width
            }

            console.log('111', data.tempFilePaths[0]);
            // 绘制圆角时填充色透明了，这里还原画布填充色
            ctx.setFillStyle('#333333')
            // 先绘制封面图 drawImage(imageResource:图片资源路径, sx:裁剪框左上角x, sy:裁剪框左上角y, sWidth:裁剪框宽度, sHeight：裁剪框高度, dx：绘制内容左上角x, dy：绘制内容左上角y, dWidth：绘制内容宽度, dHeight：绘制内容高度)
            console.log('222');
            ctx.drawImage(data.tempFilePaths[0], clip_left, clip_top, clip_width, clip_height, 0, 0, canvas_width, canvas_height);
            console.log('333');
            // 先绘制一遍，为了获取原图本地路径
            ctx.draw(false, () => {
              console.log('444');
              wx.showLoading({
                title: '正在生成卡片',
                mask: true
              })

              // 获取原图本地路径
              wx.canvasToTempFilePath({
                canvasId: layoutType == 0 ? 'myCanvas1' : 'myCanvas2',
                success(res) {
                  console.log('555');
                  this_.setData({
                    customzieImageOriginLocal: res.tempFilePath
                  })
                  // 区分横竖版绘制LOGO文本
                  if (layoutType == 0) {
                    ctx.drawImage('/images/logo1.png', 10, 10, 40, 40);
                    ctx.drawImage('/images/logo2.png', 240, 125, 60, 60);
                    ctx.setFontSize(14);
                    ctx.fillText('卡号:88888888', 10, 180);
                  } else {
                    ctx.drawImage('/images/logo1.png', 10, 10, 40, 40);
                    ctx.drawImage('/images/logo2.png', 130, 5, 60, 60);
                    ctx.setFontSize(14);
                    ctx.fillText('卡号:88888888', 10, 300);
                  }
                  // 绘制拼接图。这里选true 接着上一次的绘制，否则拼接图上绘制不到封面图
                  ctx.draw(true, () => {
                    // 获取拼接图本地路径
                    wx.canvasToTempFilePath({
                      canvasId: layoutType == 0 ? 'myCanvas1' : 'myCanvas2',
                      success(res) {
                        wx.hideLoading();
                        if (layoutType == 0) {
                          this_.setData({
                            customizeImage1: res.tempFilePath
                          })
                        } else {
                          this_.setData({
                            customizeImage2: res.tempFilePath
                          })
                        }
                      },
                      fail(e) {
                        console.log(e)
                      }
                    }, this_);
                  });
                },
                fail(e) {
                  console.log(e)
                }
              }, this_);

            })

          }
        })

      },
    })
  },

  /**
   * 
   * @param {CanvasContext} ctx canvas上下文
   * @param {number} x 圆角矩形选区的左上角 x坐标
   * @param {number} y 圆角矩形选区的左上角 y坐标
   * @param {number} w 圆角矩形选区的宽度
   * @param {number} h 圆角矩形选区的高度
   * @param {number} r 圆角的半径
   */
  roundRect: function(ctx, x, y, w, h, r) {
    // 开始绘制
    ctx.beginPath()
    // 因为边缘描边存在锯齿，最好指定使用 transparent 填充
    // 这里是使用 fill 还是 stroke都可以，二选一即可

    // 设置填充色为透明
    ctx.setFillStyle('transparent')
    // ctx.setStrokeStyle('transparent')
    // 左上角
    ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)

    // border-top
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.lineTo(x + w, y + r)
    // 右上角
    ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)

    // border-right
    ctx.lineTo(x + w, y + h - r)
    ctx.lineTo(x + w - r, y + h)
    // 右下角
    ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)

    // border-bottom
    ctx.lineTo(x + r, y + h)
    ctx.lineTo(x, y + h - r)
    // 左下角
    ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)

    // border-left
    ctx.lineTo(x, y + r)
    ctx.lineTo(x + r, y)

    // 这里是使用 fill 还是 stroke都可以，二选一即可，但是需要与上面对应
    ctx.fill()
    // ctx.stroke()
    ctx.closePath()
    // 剪切
    ctx.clip()
  },




})