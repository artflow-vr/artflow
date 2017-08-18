[![Build Status](https://travis-ci.org/DavidPeicho/artflow.svg?branch=master)](https://travis-ci.org/DavidPeicho/artflow)

# Artflow

**ArtFlow** is a frontend VR 3D software, in which you can draw your own world using VR controllers.

**ArtFlow** is greatly influenced by [Tilt Brush](https://www.tiltbrush.com/), and [A-Painter](https://github.com/aframevr/a-painter).

## Local Execution

### Dependencies
In order to use the application locally, you need to have a relatively new version of [Yarn](https://yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/) installed on your system.

### Build
You can build the application by using the following npm command:
```sh
$ cd path/to/artflow
$ yarn run build
```
The output generated by [Webpack](https://webpack.github.io/) is located in the *build/* folder.

## Development Environment
If you want to modify the application, you can use the development environment we created.
You first have to launch the development server, by running:
```sh
$ cd path/to/artflow
$ yarn run dev
```

The [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html) will watch for changes and you can directly modify the code.

## Three.js Code Reuse

**ArtFlow** is built upon a [Model-view-controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller), where views are Three.js *Object3D*, or our custom wrapper over Three.js *Object3D*. Basically, you can reuse every controller in your Three.js projects, such as the teleporter, or the brush, by changing only one or two lines of code.

### TODO

#### Brushes
* [ ] Add pressure
* [ ] Add strokes system
