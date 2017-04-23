# TrueTicket WebPack configuration
Example how to use webpack for TT

## Install YARN (package manager) for Debian

```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
```

## Starting from the basic example

```bash
git clone https://github.com/meox/tt_webpack.git

#setup yarn
yarn

#update it (optional)
yarn upgrade
```
Under the **src** directory put all your *Plugins*, you should have something like this:
  
![image-folder](https://cloud.githubusercontent.com/assets/852548/25313524/50709ac2-2830-11e7-954c-1fde475afc13.png)

Under the *src* directory you can put other directories (like common) and other js libraries or file that contains you code.

## How to include a JS file into onother
Consider the *hello_world.js* plugin. At the beginning it look likes:
```javascript
import * as common_voice from './common/voice'
```

As you can see it imports (using **import** directive from ES2015) the module *voice* that is located under *common* folder.
If you open common/voice.js file you can see at the beginning smthg like this:
```javascript
export function loadEnumeResolver(obj, tkt)
{
...
}
```
The important part is that every function that you want export should be preceded by **export** keyword.

## WebPack Config (webpack.config.js)

In order to generate a bundle for a certain plugin you have to add an entry inside *webpack.config.js* file:
```javascript
var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: {
    hello_world: './src/hello_world.js',
    ucq03: './src/ucq03.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name]_bundle.js',
    library: 'tt'
  },
  module: {
    ...
  }
}; 
```
Under *entry* section you can add a new plugin simply put the name and the location of the main file. After that we can compile yours bundle.

## Compiling
From the command line, in the main folder do this:
```bash
yarn build
```

This will generates under *dist* folder the bundle version for every plugin configured in *webpack.config.js*.
