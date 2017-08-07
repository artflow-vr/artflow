[![Build Status](https://travis-ci.org/DavidPeicho/artflow.svg?branch=master)](https://travis-ci.org/DavidPeicho/artflow)

# Artflow

**ArtFlow** is a frontend VR 3D software, in which you can draw your own world using VR controllers.

**ArtFlow** is greatly influenced by [Tilt Brush](https://www.tiltbrush.com/)

## Local Execution

### Dependencies
In order to use the application locally, you need to have a relatively new version of [Yarn](https://yarnpkg.com/lang/en/) or [npm](https://www.npmjs.com/) installed on your system.

### Build
You can build the application by using the following npm command:
```sh
$ cd path/to/artflow
$ npm run build
```
The output generated by [Webpack](https://webpack.github.io/) is located in the *build/* folder.

## Development Environment
If you want to modify the application, you can use the development environment we created.
You first have to launch the development server, by running:
```sh
$ cd path/to/artflow
$ npm run dev
```

The [webpack-dev-server](https://webpack.github.io/docs/webpack-dev-server.html) will watch for changes and you can directly modify the code.

## TODO

* Structure
  * [X] Add jsformatter
  
* VR
  * [ ] Refactor ControlModule beginning messy with the two pipelines.
  * [ ] Adds simple UI system for selecting objects
  * [ ] Make drawing first test integration into the new pipeline
