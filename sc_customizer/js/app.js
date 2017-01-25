var main = {
  // константы
  cons: {
    1: 'rect:16x9',
    2: 'rect:4x3',
    3: 'rect:1x1',
    4: 'rect:free',
    5: 'ellipse:16x9',
    6: 'circle:free'
  }
  , colors: ['red', 'lime', 'blue']
  , slots: {}

  , stage: null
  , layer: null

  , makeShape: function(name, shape, dim) {
    // проверяем если есть фигура с именем name и удаляем её
    var figures = this.stage.find('.' + name);
    if (figures.length) {
      figures[0].getParent().destroy();
      this.colors.unshift(figures[0].getAttr('fill'));
      this.layer.draw();
    }

    var color = this.colors.shift();
    
    var width,
        height;
    if (dim == 'free') {
      width = Math.random() * (600 - 100) + 100;;
      height = Math.random() * (500 - 70) + 70;
    } else {
      var pr = dim.split('x');
      width = Math.random() * (600 - 100) + 100;
      height = width / pr[0] * pr[1]
    }

    // создаём фигуру
    var figure;
    if (shape == 'rect') {
      figure = new Konva.Rect({
        width: width,
        height: height,
        prop: dim,
        name: name
      });
    } else if (shape == 'circle') {
      figure = new Konva.Circle({
        radius: (width + height) / 3,
        name: name
      });    
    } else {
      var x = (width + height) / 3;
      figure = new Konva.Ellipse({
        radius: {
          x: x,
          y: x / 16 * 9
        },
        name: name
      });
    }
    var attrs = {
      fill: color,
      stroke: 'white',
      strokeWidth: 2,
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffset: {x : 5, y : 5},
      shadowOpacity: 0.5      
    }
    figure.setAttrs(attrs);

    // добавляем фигуру в группу
    var group = new Konva.Group({
      x: Math.random() * this.stage.getWidth() / 3,
      y: Math.random() * this.stage.getHeight() / 2,
      draggable: true
    });
    
    this.layer.add(group);
    group.add(figure);

    var hide;
    if (shape == 'rect') {
      if (dim != 'free') {
        hide = true;
      }
      this.addAnchor(group, -4, -4, 'topLeft', name, hide);
      this.addAnchor(group, figure.getAttr('width'), 0, 'topRight', name, hide);
      this.addAnchor(group, 0, figure.getAttr('height'), 'bottomLeft', name, hide);
      this.addAnchor(group, figure.getAttr('width'), figure.getAttr('height'), 'bottomRight', name);
    } else if (shape == 'circle') {
      this.addAnchor(group, figure.radius(), 0, 'rightMiddle', name);
    } else {
      this.addAnchor(group, figure.radiusX(), 0, 'rightMiddleE', name);
      this.addAnchor(group, 0, figure.radiusY(), 'bottomMiddle', name);
    }

    // добавить слой в stage
    this.stage.add(this.layer);

    this.slots[name] = {
      slot: figure,
      color: figure.getFill()
    };
  }

  , setToTop: function(name) {
    var figures = this.stage.find('.' + name);
    if (figures.length) {
      var figure = figures[0];
      var group = figure.getParent();
      group.moveToTop();
      this.layer.draw();
    }
  }

  , actAnchors: function(action) {
    var self = this;
    ['slot1', 'slot2', 'slot3'].forEach(function(slot, indx) {
      var s = self.layer.get('.' + slot);
      if (s.length) {
        var group = s[0].getParent();
        var children = group.getChildren();
        for (var i=0; i<children.length; i++) {
          var child = children[i];
          if (child.getName() != slot) {
            switch (action) {
              case 'hide':
                child.hide();
                break;
              case 'show':
                var dim = s[0].getAttr('prop');
                if (dim == 'free' || child.getName() == 'bottomRight'
                    || s[0].className == 'Circle' || s[0].className == 'Ellipse') {
                  child.show();
                }
                break;
            }
          }
        }
      }
    });
    this.layer.draw();
  }

  , update: function(activeAnchor, fname) {
    var group = activeAnchor.getParent();
    var figure = group.get('.' + fname)[0];
    var figureName = figure.getClassName();
    
    if (figureName == 'Rect') {
      var dim = figure.getAttr('prop');
      if (dim != 'free') {
        var pr = dim.split('x');
      }
      var topLeft = group.get('.topLeft')[0];
      var topRight = group.get('.topRight')[0];
      var bottomLeft = group.get('.bottomLeft')[0];
      var bottomRight = group.get('.bottomRight')[0];
    } else if (figureName == 'Circle') {
      var rightMiddle = group.get('.rightMiddle')[0];
    } else {
      var rightMiddleE = group.get('.rightMiddleE')[0];
      var bottomMiddle = group.get('.bottomMiddle')[0];
    }

    var anchorX = activeAnchor.getX();
    var anchorY = activeAnchor.getY();

    // update anchor positions
    switch (activeAnchor.getName()) {
      case 'topLeft':
        topRight.setY(anchorY);
        bottomLeft.setX(anchorX);
        break;
      case 'topRight':
        topLeft.setY(anchorY);
        bottomRight.setX(anchorX);
        break;
      case 'bottomRight':
        if (dim != 'free') {
          bottomRight.setY(anchorX / pr[0] * pr[1])
          bottomLeft.setY(anchorX / pr[0] * pr[1])
        } else {
          bottomLeft.setY(anchorY);
        }
        topRight.setX(anchorX);
        break;
      case 'bottomLeft':
        bottomRight.setY(anchorY);
        topLeft.setX(anchorX);
        break;
      case 'rightMiddle':
        rightMiddle.setX(anchorX);
        rightMiddle.setY(0);
        break;
      case 'rightMiddleE':
        rightMiddleE.setX(anchorX);
        rightMiddleE.setY(0);
        bottomMiddle.setY(anchorX / 16 * 9);
        break;
      case 'bottomMiddle':
        bottomMiddle.setY(anchorY);
        bottomMiddle.setX(0);
        rightMiddleE.setX(anchorY / 9 * 16);
        break;
    }

    if (figureName == 'Rect') {
      figure.position(topLeft.position());

      var width = topRight.getX() - topLeft.getX();
      if (dim == 'free') {
        var height = bottomLeft.getY() - topLeft.getY();
      } else {
        var height = width / pr[0] * pr[1]
      }
      if(width && height) {
        figure.width(width);
        figure.height(height);
      }
    } else if (figureName == 'Circle') {
      figure.radius(anchorX);
    } else {
      if (activeAnchor.getName() == 'bottomMiddle') {
        figure.setRadiusY(anchorY);
        figure.setRadiusX(anchorY / 9 * 16);
      } else {
        figure.setRadiusX(anchorX);
        figure.setRadiusY(anchorX / 16 * 9);
      }
    }
  }

  , addAnchor: function(group, x, y, name, fname, hide) {
    var stage = group.getStage();
    var layer = group.getLayer();

    var anchor = new Konva.Circle({
      x: x,
      y: y,
      stroke: '#666',
      fill: 'white',
      strokeWidth: 2,
      radius: 8,
      name: name,
      draggable: true,
      dragOnTop: false,
      //visible: false
    });
    if (hide) {
      anchor.hide();
    }

    var self = this;
    anchor.on('dragmove', function() {
      self.update(this, fname);
      self.layer.draw();
    });
    anchor.on('mousedown touchstart', function() {
      group.setDraggable(false);
      this.moveToTop();
    });
    anchor.on('dragend', function() {
      group.setDraggable(true);
      self.layer.draw();
    });
    // add hover styling
    anchor.on('mouseover', function() {
      var layer = this.getLayer();
      document.body.style.cursor = 'pointer';
      this.setStrokeWidth(4);
      layer.draw();
    });
    anchor.on('mouseout', function() {
      var layer = this.getLayer();
      document.body.style.cursor = 'default';
      this.setStrokeWidth(2);
      layer.draw();
    });

    group.add(anchor);
  }

  , download: function() {
    var name = document.querySelector('#archive_name').value;
    if (!name) {
      alert('Please, enter archive name!');
      return
    }

    var stage = this.stage;
    var layer = this.layer;

    var c = layer.getCanvas()._canvas;
    var ctx = c.getContext('2d');
    
    this.actAnchors('hide');

    stage.draw();
    
    var zip = JSZip();    
    var bkg = layer.get('Image')[0];
    bkg.visible(true);
    stage.draw();
    var imageData1 = stage.toDataURL({pixelRatio: 1});
    zip.file('scene_example.png', imageData1.substr(imageData1.indexOf(',') + 1), {base64: true});
    bkg.visible(false);

    // чистим фигуры
    for (var slot_name in this.slots) {
      var slot = this.slots[slot_name].slot;
      //slot.strokeEnabled(false);
      slot.shadowEnabled(false);
    }
    stage.draw();
    var imageData2 = stage.toDataURL({pixelRatio: 1});
    zip.file('scene_slots.png', imageData2.substr(imageData2.indexOf(',') + 1), {base64: true});
    var imageSlotsData = ctx.getImageData(0, 0, stage.getWidth(), stage.getHeight());

    for (var slot_name in this.slots) {
      var slot = this.slots[slot_name].slot;
      //slot.strokeEnabled(true);
      slot.setFill(null);
      slot.shadowEnabled(true);
    }
    stage.draw()

    // холст только с рамками и тенями от них
    var imageStrokesData = ctx.getImageData(0, 0, stage.getWidth(), stage.getHeight());
    
    // прячем скрытые рамки и тени
    var data = imageSlotsData.data;
    for(var i=0; i<data.length; i+=4) {
      if ((data[i] == 255 && data[i+1] == 0 && data[i+2] == 0)
          || (data[i] == 0 && data[i+1] == 255 && data[i+2] == 0)
          || (data[i] == 0 && data[i+1] == 0 && data[i+2] == 255)) {
        // Основная работа
        imageStrokesData.data[i+3] = 0;
      }
    }

    this.data = imageStrokesData;
    ctx.putImageData(imageStrokesData, 0, 0);
    
    var imageData3 = stage.toDataURL({pixelRatio: 1});
    zip.file('scene.png', imageData3.substr(imageData3.indexOf(',') + 1), {base64: true});

    var self = this;
    zip.generateAsync({type: 'blob'}).then(function(content) {
      saveAs(content, name + '.zip');

      // возвращаем фигуры
      for (var slot_name in self.slots) {
        var slot = self.slots[slot_name].slot;
        slot.show();
        slot.strokeEnabled(true);
        slot.shadowEnabled(true);
        slot.setFill(self.slots[slot_name].color);
        self.layer.draw();
      }
      self.actAnchors('show');
    });
  }

  , init: function() {
    var self = this;
    
    // создание хоста
    this.stage = new Konva.Stage({
      container: 'canvas',
      width: 1280,
      height: 720
    });

    // создаём слой
    this.layer = new Konva.Layer();
    
    // вешаем на селекторы монитор событий
    var slot_names = document.querySelectorAll('#slot1, #slot2, #slot3');
    [].map.call(slot_names, function(slot) {
      slot.addEventListener('change', function() {
        var sIndex = this.options['selectedIndex'];
        if (sIndex != 0) {
          var val = this.options[sIndex].value;
          var params = self.cons[val].split(':');
          var shape = params[0];
          var dim = params[1];
          self.makeShape(this.id, shape, dim);
        }
        //this.options[0].selected = true;
      });
    });

    // событие показать результат
    document.querySelector('#show').addEventListener('click', function() {
      self.actAnchors('hide');
      var bkg = self.layer.get('Image')[0];
      bkg.visible(true);
      self.stage.draw();

      var imageData = self.stage.toDataURL({pixelRatio: 1});
      var image = new Image();
      image.src = imageData;

      var win = window.open('', '_blank');
      win.document.write(image.outerHTML);

      bkg.visible(false);
      self.actAnchors('show');
    });

    var imageObj = new Image();
    imageObj.onload = function() {
      var bkgrnd = new Konva.Image({
        x: 0,
        y: 0,
        image: imageObj,
        width: 1280,
        height: 720,
        visible: false
      });

      self.layer.add(bkgrnd);
      self.stage.add(self.layer);
    }
    // http://stackoverflow.com/questions/24440212/kineticjs-kinetic-warning-unable-to-get-data-url
    // imageObj.src = './img/background.png';
    // Если скрипт работает через сервер, раскомментируйте строку выше
    // и закомментируйте две строки ниже
    imageObj.crossOrigin = 'anonymous';
    imageObj.src = 'https://dl.dropboxusercontent.com/u/65129102/background.png';

    // событие скачать архив
    document.querySelector('#download').addEventListener('click', this.download.bind(this));
  }
}

main.init();
