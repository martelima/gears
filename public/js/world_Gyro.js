var world_Gyro = new function() {
  var self = this;

  this.name = 'gyro';
  this.shortDescription = 'Gyro Challenges';
  this.longDescription =
    '<p>A series of challenges that focuses on gyro usage.</p>';
  this.thumbnail = 'images/worlds/gyro.jpg';

  this.options = {};
  this.robotStart = {
    position: new BABYLON.Vector3(0, 0, 0)
  };

  this.optionsConfigurations = [
    {
      option: 'image',
      title: 'Select Challenge',
      type: 'selectWithHTML',
      options: [
        ['Straight Run', 'straight'],
        ['Square Loops', 'square']
      ],
      optionsHTML: {
        straight:
          '<p class="bold">A simple straight run.</p>' +
          '<p>You just have to drive straight to the end. Easy right?<p>',
        square:
          '<p class="bold">Drive around the square.</p>' +
          '<p>The black area can be used to help you align your turns.<p>' +
          '<p>Task 1: Drive around the loop without falling off.<p>' +
          '<p>Task 2: Complete as many loops as you can without falling off.<p>',
      }
    }
  ];

  this.imagesURL = {
    straight: 'textures/maps/Gyro/Straight.png',
    square: 'textures/maps/Gyro/Square.png',
  };

  this.robotStarts = {
    straight: new BABYLON.Vector3(0, 0, -500),
    square: new BABYLON.Vector3(-100, 0, -90),
  }

  this.defaultOptions = {
    image: 'straight',
    length: 100,
    width: 100,
    groundFriction: 1,
    wallFriction: 0.1,
    groundRestitution: 0.0,
    wallRestitution: 0.1
  };

  // Set options, including default
  this.setOptions = function(options) {
    let tmpOptions = {};
    Object.assign(tmpOptions, self.defaultOptions);
    Object.assign(tmpOptions, self.options);
    Object.assign(self.options, tmpOptions);

    for (let name in options) {
      if (typeof self.options[name] == 'undefined') {
        console.log('Unrecognized option: ' + name);
      } else {
        self.options[name] = options[name];
      }
    }

    self.robotStart.position = self.robotStarts[self.options.image];

    return new Promise(function(resolve, reject) {
      if (! self.imagesURL[self.options.image]) {
        resolve();
        return;
      }

      var img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = function() {
        self.options.length = this.width / 10.0;
        self.options.width = this.height / 10.0;

        resolve();
      }
      img.src = self.imagesURL[self.options.image];
    });
  };

  // Run on page load
  this.init = function() {
    self.setOptions();
  };

  // Load image into ground tile
  this.loadImageTile = function (scene, imageSrc, size, pos=[0,0], rot=Math.PI/2) {
    var groundMat = new BABYLON.StandardMaterial('ground', scene);
    var groundTexture = new BABYLON.Texture(imageSrc, scene);
    groundMat.diffuseTexture = groundTexture;
    groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
    groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);

    var faceUV = new Array(6);
    for (var i = 0; i < 6; i++) {
        faceUV[i] = new BABYLON.Vector4(0, 0, 0, 0);
    }
    faceUV[4] = new BABYLON.Vector4(0, 0, 1, 1);

    var boxOptions = {
        width: size[0],
        height: 10,
        depth: size[1],
        faceUV: faceUV
    };

    var ground = BABYLON.MeshBuilder.CreateBox('box', boxOptions, scene);
    ground.material = groundMat;
    ground.receiveShadows = true;
    ground.position.y = -5;
    ground.position.x = pos[0];
    ground.position.z = pos[1];
    ground.rotation.y = rot;

    // Physics
    ground.physicsImpostor = new BABYLON.PhysicsImpostor(
      ground,
      BABYLON.PhysicsImpostor.BoxImpostor,
      {
        mass: 0,
        friction: self.options.groundFriction,
        restitution: self.options.groundRestitution
      },
      scene
    );
  };

  // Create the scene
  this.load = function (scene) {
    return new Promise(function(resolve, reject) {
      if (self.options.image == 'square') {
        self.loadImageTile(
          scene,
          self.imagesURL[self.options.image],
          [self.options.width, self.options.length],
          [-self.options.width/2, self.options.length/2],
          Math.PI / 2
        );
        self.loadImageTile(
          scene,
          self.imagesURL[self.options.image],
          [self.options.width, self.options.length],
          [self.options.length/2, self.options.width/2],
          Math.PI
        );
        self.loadImageTile(
          scene,
          self.imagesURL[self.options.image],
          [self.options.width, self.options.length],
          [self.options.width/2, -self.options.length/2],
          -Math.PI / 2
        );
        self.loadImageTile(
          scene,
          self.imagesURL[self.options.image],
          [self.options.width, self.options.length],
          [-self.options.length/2, -self.options.width/2],
          0
        );

      } else {
        self.loadImageTile(
          scene,
          self.imagesURL[self.options.image],
          [self.options.width*5, self.options.length]
        );
      }

      resolve();
    });
  };
}

// Init class
world_Gyro.init();

if (typeof worlds == 'undefined') {
  var worlds = [];
}
worlds.push(world_Gyro);