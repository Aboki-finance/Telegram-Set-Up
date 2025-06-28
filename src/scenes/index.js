// src/scenes/index.js
const { Stage } = require('telegraf/scenes');
const welcomeScene = require('./welcomeScene');
const buyScene = require('./buyScene');
const sellScene = require('./sellScene');
const mainMenuScene = require('./mainMenuScene');

function createStage() {
  const stage = new Stage([
    welcomeScene,
    buyScene,
    sellScene,
    mainMenuScene
  ]);
  
  // Global scene actions
  stage.action("BUY", (ctx) => ctx.scene.enter("buy"));
  stage.action("SELL", (ctx) => ctx.scene.enter("sell"));
  stage.action("MAIN_MENU", (ctx) => ctx.scene.enter("main_menu"));
  
  return stage;
}

module.exports = { createStage };