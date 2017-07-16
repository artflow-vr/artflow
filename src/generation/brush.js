'use strict';

let THREE = require('three');

let brush = {};

brush = function(vboLimit, rootScene, texPath) {

  var verticesCount = 0;

  var tex = new THREE.TextureLoader().load(texPath);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set( 4, 4 );

  var material;

  if (texPath)
    material = new THREE.MeshBasicMaterial( {
      side : THREE.DoubleSide,
      map : tex,
      writeframe : false
    } );
  else
    material = new THREE.MeshBasicMaterial( {
      color : 0xff0000,
      side : THREE.DoubleSide,
      writeframe : false
    } );

  var mesh = new THREE.Mesh(geometry, material);

  var geometry;
  var vertices;
  var normals;
  var uvs;

  //
  this.initBrush = function() {

    geometry = new THREE.BufferGeometry();
    vertices = new Float32Array(vboLimit * 3 * 3);
    normals = new Float32Array(vboLimit * 3 * 3);
    uvs = new Float32Array(vboLimit * 2 * 2);

    geometry.setDrawRange(0, 0);
    geometry.addAttribute('position', new THREE.BufferAttribute(vertices, 3).setDynamic(true));
    geometry.addAttribute('uv', new THREE.BufferAttribute(uvs, 2).setDynamic(true));
    geometry.addAttribute('normal', new THREE.BufferAttribute(normals, 3).setDynamic(true));

    verticesCount = 0;

    var mesh = new THREE.Mesh(geometry, material);

    mesh.drawMode = THREE.TriangleStripDrawMode;
    mesh.frustumCulled = false;
    //mesh.vertices = vertices;

    rootScene.add(mesh);

  };

  this.addPoint = function(pointCoords) {

      var a = new THREE.Vector3(pointCoords.x, pointCoords.y, pointCoords.z);
      vertices[verticesCount++] = a.x;
      vertices[verticesCount++] = a.y;
      vertices[verticesCount++] = a.z;

      var b = new THREE.Vector3( 10 + pointCoords.x, -10 + pointCoords.y, pointCoords.z);
      vertices[verticesCount++] = b.x;
      vertices[verticesCount++] = b.y;
      vertices[verticesCount++] = b.z;

      geometry.attributes.normal.needsUpdate = true;
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.uv.needsUpdate = true;

      geometry.setDrawRange(0, verticesCount / 3);

      console.log(vertices)
      console.log(verticesCount)

  };

};

module.exports = brush;
