# tt_webpack
example how to use webpack for TT

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

As you can see it include (using **import** directive from ES2015) the module *voice* that is located under *common* folder.
If you open common/voice.js:
```javascript
export function loadEnumeResolver(obj, tkt)
{
...
}
```
The important part is that every function that you would like to export should be preceded by **export** keyword.
