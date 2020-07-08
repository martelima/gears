var simPanel = new function() {
  var self = this;

  // Run on page load
  this.init = function() {
    self.$console = $('.console');
    self.$consoleBtn = $('.console .chevron');
    self.$consoleContent = $('.console .content');
    self.$consoleClear = $('.console .clear');
    self.$runSim = $('.runSim');
    self.$world = $('.world');
    self.$reset = $('.reset');
    self.$camera = $('.camera');

    self.$consoleBtn.click(self.toggleConsole);
    self.$console.on('transitionend', self.scrollConsoleToBottom);
    self.$consoleClear.click(self.clearConsole);
    self.$runSim.click(self.runSim);
    self.$world.click(self.selectWorld);
    self.$reset.click(self.resetSim);
    self.$camera.click(self.switchCamera);
  };

  // switch camera
  this.switchCamera = function() {
    if (babylon.cameraMode == 'arc') {
      babylon.setCameraMode('follow');
      self.$camera.html('&#x1f4f9; Follow');

    } else if (babylon.cameraMode == 'follow') {
      babylon.setCameraMode('orthoTop');
      self.$camera.html('&#x1f4f9; Top');

    } else if (babylon.cameraMode == 'orthoTop') {
      babylon.setCameraMode('arc');
      self.$camera.html('&#x1f4f9; Arc');
    }
  };

  // Select world map
  this.selectWorld = function() {
    let $body = $('<div class="selectWorld"></div>');
    let $select = $('<select></select>');
    let $description = $('<div class="description"><img class="thumbnail"><div class="text"></div></div>');
    let $configurations = $('<div class="configurations"></div>');

    let worldOptionsSetting = {};

    function getTitle(opt) {
      let $title = $('<div class="configurationTitle"></div>');
      let $toolTip = $('<span> </span><div class="tooltip">?<div class="tooltiptext"></div></div>');
      $title.text(opt.title);

      if (opt.help) {
        $toolTip.find('.tooltiptext').text(opt.help);
        $title.append($toolTip);
      }
      if (opt.helpSide) {
        $toolTip.addClass(opt.helpSide);
      } else {
        $toolTip.addClass('right');
      }

      return $title;
    }

    function genSelect(opt, currentOptions) {
      let $div = $('<div class="configuration"></div>');
      let $select = $('<select></select>');
      let currentVal = currentOptions[opt.option];

      opt.options.forEach(function(option){
        let $opt = $('<option></option>');
        $opt.prop('value', option[1]);
        $opt.text(option[0]);
        if (option[1] == currentVal) {
          $opt.attr('selected', true);
        }

        $select.append($opt);
      });

      $select.change(function(){
        worldOptionsSetting[opt.option] = $select.val();
      });

      $div.append(getTitle(opt));
      $div.append($select);

      return $div;
    }

    function genCheckBox(opt, currentOptions) {
      let id = Math.random().toString(36).substring(2, 6);
      let $div = $('<div class="configuration"></div>');
      let $checkbox = $('<input type="checkbox" id="' + id + '">');
      let $label = $('<label for="' + id + '"></label>');
      let currentVal = currentOptions[opt.option];

      $label.text(opt.label);

      if (currentVal) {
        $checkbox.prop('checked', true);
        worldOptionsSetting[opt.option] = true;
      } else {
        worldOptionsSetting[opt.option] = false;
      }
      $checkbox.change(function(){
        worldOptionsSetting[opt.option] = $checkbox.prop('checked');
      });

      $div.append(getTitle(opt));
      $div.append($checkbox);
      $div.append($label);

      return $div;
    }

    function genSlider(opt, currentOptions) {
      let $div = $('<div class="configuration"></div>');
      let $sliderBox = $(
        '<div class="slider">' +
          '<input type="range">' +
          '<input type="text">' +
        '</div>'
      );
      let $slider = $sliderBox.find('input[type=range]');
      let $input = $sliderBox.find('input[type=text]');
      let currentVal = currentOptions[opt.option];

      $slider.attr('min', opt.min);
      $slider.attr('max', opt.max);
      $slider.attr('step', opt.step);
      $slider.attr('value', currentVal);
      $input.val(currentVal);

      $slider.on('input', function(){
        worldOptionsSetting[opt.option] = parseInt($slider.val());
        $input.val($slider.val());
      });
      $input.change(function(){
        worldOptionsSetting[opt.option] = parseInt($input.val());
        $slider.val($input.val());
      });

      $div.append(getTitle(opt));
      $div.append($sliderBox);

      return $div;
    }

    function genText(opt, currentOptions) {
      let $div = $('<div class="configuration"></div>');
      let $textBox = $('<div class="text"><input type="text"></div>');
      let $input = $textBox.find('input');
      let currentVal = currentOptions[opt.option];

      $input.val(currentVal);

      $input.change(function(){
        worldOptionsSetting[opt.option] = $input.val();
      });

      $div.append(getTitle(opt));
      $div.append($textBox);

      return $div;
    }

    function genFile(opt, currentOptions) {
      let $div = $('<div class="configuration"></div>');
      let $file = $('<input type="file">');
      $file.attr('accept', opt.accept);

      $file.change(function(){
        if (this.files.length) {
          worldOptionsSetting[opt.option] = URL.createObjectURL(this.files[0]);
        }
      });

      $div.append(getTitle(opt));
      $div.append($file);

      return $div;
    }

    function displayWorldOptions(world, worldOptions) {
      $description.find('.text').html(world.longDescription);
      if (world.thumbnail) {
        $description.find('.thumbnail').attr('src', world.thumbnail);
      } else {
        $description.find('.thumbnail').attr('src', 'images/worlds/default_thumbnail.png');
      }

      $configurations.empty();
      worldOptionsSetting = {};
      for (let optionConfiguration of world.optionsConfigurations) {
        if (optionConfiguration.type == 'select') {
          $configurations.append(genSelect(optionConfiguration, worldOptions));
        } else if (optionConfiguration.type == 'checkbox') {
          $configurations.append(genCheckBox(optionConfiguration, worldOptions));
        } else if (optionConfiguration.type == 'slider') {
          $configurations.append(genSlider(optionConfiguration, worldOptions));
        } else if (optionConfiguration.type == 'text') {
          $configurations.append(genText(optionConfiguration, worldOptions));
        } else if (optionConfiguration.type == 'file') {
          $configurations.append(genFile(optionConfiguration, worldOptions));
        }
      }
    }

    worlds.forEach(function(world){
      let $world = $('<option></option>');
      $world.prop('value', world.name);
      $world.text(world.shortDescription);
      if (world.name == babylon.world.name) {
        $world.attr('selected', 'selected');
        displayWorldOptions(world, world.options);
      }
      $select.append($world);
    });

    $body.append($select);
    $body.append($description);
    $body.append($configurations);

    $select.change(function(){
      let world = worlds.find(world => world.name == $select.val());
      displayWorldOptions(world, world.options);
    });

    let $buttons = $(
      '<button type="button" class="save btn-light">Save</button>' +
      '<button type="button" class="load push-left btn-light">Load</button>' +
      '<button type="button" class="default btn-light">Default</button>' +
      '<button type="button" class="cancel btn-light">Cancel</button>' +
      '<button type="button" class="confirm btn-success">Ok</button>'
    );

    let $dialog = dialog('Select World', $body, $buttons);

    $buttons.siblings('.save').click(function() {
      let world = worlds.find(world => world.name == $select.val());
      let saveObj = {
        worldName: $select.val(),
        options: {}
      }
      Object.assign(saveObj.options, world.defaultOptions);
      Object.assign(saveObj.options, worldOptionsSetting);

      var hiddenElement = document.createElement('a');
      hiddenElement.href = 'data:application/json;base64,' + btoa(JSON.stringify(saveObj));
      hiddenElement.target = '_blank';
      hiddenElement.download = $select.val() + 'Map_config.json';
      hiddenElement.dispatchEvent(new MouseEvent('click'));
    });
    $buttons.siblings('.load').click(function() {
      var hiddenElement = document.createElement('input');
      hiddenElement.type = 'file';
      hiddenElement.accept = 'application/json,.json';
      hiddenElement.dispatchEvent(new MouseEvent('click'));
      hiddenElement.addEventListener('change', function(e){
        var reader = new FileReader();
        reader.onload = function() {
          let loadedSave = JSON.parse(this.result);
          let world = worlds.find(world => world.name == loadedSave.worldName);

          if (typeof world == 'undefined') {
            toastMsg('Invalid map configurations');
            return;
          }

          displayWorldOptions(world, loadedSave.options);
          worldOptionsSetting = loadedSave.options;
        };
        reader.readAsText(e.target.files[0]);
      });
    });
    $buttons.siblings('.default').click(function() {
      let world = worlds.find(world => world.name == $select.val());
      displayWorldOptions(world, world.defaultOptions);
    });
    $buttons.siblings('.cancel').click(function() { $dialog.close(); });
    $buttons.siblings('.confirm').click(function(){
      babylon.world = worlds.find(world => world.name == $select.val());
      babylon.world.setOptions(worldOptionsSetting).then(function(){
        self.resetSim();
      });
      $dialog.close();
    });
  };

  // Run the simulator
  this.runSim = function() {
    if (skulpt.running) {
      skulpt.hardInterrupt = true;
      self.setRunIcon('run');
    } else {
      if (! pythonPanel.modified) {
        pythonPanel.loadPythonFromBlockly();
      }
      robot.reset();
      skulpt.runPython();
      self.setRunIcon('stop');
    }
  };

  // Set run icon
  this.setRunIcon = function(type) {
    if (type == 'run') {
      self.$runSim.html('&#x25b6;');
    } else {
      self.$runSim.html('&#x23f9;');
    }
  };

  // Reset simulator
  this.resetSim = function() {
    babylon.removeMeshes(babylon.scene);
    babylon.loadMeshes(babylon.scene);
    skulpt.hardInterrupt = true;
    self.setRunIcon('run');
  };

  // Strip html tags
  this.stripHTML = function(text) {
    const regex = /</g;
    const regex2 = />/g;
    return text.replace(regex, '&lt;').replace(regex2, '&gt;');
  }

  // write to console
  this.consoleWrite = function(text) {
    text = simPanel.$consoleContent.html() + self.stripHTML(text);
    simPanel.$consoleContent.html(text);
    self.scrollConsoleToBottom();
  };

  // write to console
  this.consoleWriteErrors = function(text) {
    text = '<span class="error">' + self.stripHTML(text) + '</span>\n';
    text = simPanel.$consoleContent.html() + text;
    simPanel.$consoleContent.html(text);
    self.scrollConsoleToBottom();
  }

  // clear all content
  this.clearConsole = function() {
    simPanel.$consoleContent.html('');
  };

  // Toggle opening and closing of console
  this.toggleConsole = function() {
    self.$console.toggleClass('open');
  };

  // Scroll console to bottom
  this.scrollConsoleToBottom = function() {
    var pre = self.$consoleContent[0];
    pre.scrollTop = pre.scrollHeight - pre.clientHeight
  };
}

simPanel.init();