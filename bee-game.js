const template = document.createElement("template")
template.innerHTML = /*html*/`
<style>
    :host [data-game] {

    background-color: #113300;
    display: grid;
    grid-template-columns: 1fr 4em;
    grid-template-rows: calc(100vh - 8em) 8em;
    position: relative;
    font-family: sans-serif;
 }
  
 main {
    grid-column: 1;
    grid-row: 1;
 }

  aside {
    font-size: 2em;
    grid-column: 2;
    grid-row: 1;
    right: 0; }
  
  footer {
    grid-column: 1 / span 2;
    grid-row: 2;
}

button {
    border-radius: 0.1em;
    padding: 0.1em 0.2em;
}
  
  a {
    color: white; }

    
  .tiles {
    box-sizing: border-box;
    display: inline-block; }
  
  .tile {
    --x: 0;
    --y: 0;
    box-sizing: border-box;
    border-top: solid 5px;
    border-left: solid 5px;
    border-color: #1f5c00;
    background-color: #336600;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: calc(var(--y) * 6em);
    left: calc(var(--x) * 6em);
    width: 6em;
    height: 6em;
    z-index: 0; }
  
  .visually-hidden {
    flex: 0 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    height: 1px;
    overflow: hidden;
    position: absolute;
    white-space: nowrap;
    width: 1px; }
  
  .controls {
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: space-around;
    list-style-type: none; }
  
  .control {
    background-color: rgba(0, 20, 7, 0.8);
    border: 0;
    box-sizing: border-box;
    font-size: 6.2em;
    cursor: pointer;
    text-align: center; 
    line-height: 100%;
}
  
  ::slotted([slot="bee"]) {
    --x: 0;
    --y: 0;
    height: 6em;
    position: absolute;
    transition: all 500ms ease;
    transform: translate(calc(6em * var(--x)), calc(6em * var(--y)));
    width: 6em;
    z-index: 100; }
  
  [data-go] {
    color: white;
    background-color: rgba(0, 43, 255, 0.8); 
}
  
  .control:hover {
    background-color: rgba(0, 170, 255, 0.8); }
  
  .finish-message {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0, 0.3);
    color: #fee;
    margin: 0;
    z-index: 999;
    font-size: 6em;
    gap: 1em;
  }

  .hidden {
    display: none; 
    }
</style>
    <div data-game>
        <p class="hidden finish-message" data-finish-message>You <span data-field="gameState"></span></p>
<main >
<div class="tiles" data-tiles>
     <slot name="tile"></slot>
</div>
<div class="objects">
      <slot name="bee"></slot>
</div>
</main>
<aside></aside>
<footer>
<ul  class="controls">
     <li><button class="control" data-dir="down">&#128071;</button></li>
     <li><button class="control" data-dir="left">&#128072;</button></li>
     <li><button class="control" data-dir="right">&#128073;</button></li>
     <li><button class="control" data-dir="up">&#128070;</button></li>
     <li><button class="control" data-go >go</button></li>
</ul>
</footer>`

class BeeGame extends HTMLElement {
    dirs = {
        left: "&#128072",
        right: "&#128073",
        up: "&#128070",
        down: "&#128071"
   }
   state = {
        gameState: "playing",
        commands: [],
        bee: {
             x: 0,
             y: 0
        },
        endTile: {
            x: 0,
            y: 0
        }
   }
    constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        
        shadow.append(template.content.cloneNode(true))
       const { state, dirs} = this
       const programDisplay = shadow.querySelector('aside')
       const bee = shadow.querySelector('slot[name="bee"]').assignedElements()[0]
       const tiles = shadow.querySelector('slot[name="tile"]').assignedElements()
       const endTile = tiles.find(x => x.dataset.tile == "end")
       const finishMessage = shadow.querySelector("[data-finish-message]")


       state.endTile = {...state.endTile, ...getElCoords(endTile)}

       shadow.addEventListener('click', function addCommand(ev) {
            if('dir' in ev.target.dataset) {
                 state.commands.push(ev.target.dataset.dir)
                 console.log(state.commands)
                 render(state)
            }
       })
       
       shadow.addEventListener('click', function runCommands(ev) {
            if('go' in ev.target.dataset) {
                 function loop(commands) {
                      const command = state.commands.shift()
                      if(commands.length) {
                           setTimeout(loop, 600, commands)
                      } 
                      
                      const [x, y] = move(command)
                      
                      if(isOnATile(tiles, addCoords(state.bee, {x,y}))) {
                 
                        state.bee = {...state.bee, ...addCoords(state.bee, {x,y})}
                      }
                      if(commands.length <= 0) {
                        state.gameState = inSamePlace(state.bee, state.endTile) ? "win" : "loose";
                      }
                      render(state)
                 }
                 loop(state.commands)
            }
       })

       finishMessage.addEventListener("click", () => {
        resetState();
        render(state);
       });
       
       function inSamePlace(a, b) {
        return a.x == b.x && a.y == b.y
       }
       
       function addCoords(a,b) {
        return { 
            x: a.x + b.x, 
            y: a.y + b.y 
        };
       }

       function move(command) {
            const moves = {
                  left: [-1,0],
                  right: [1,0],
                  up: [0,-1],
                  down: [0,1]
            }
            return moves[command]
       }

       function isOnATile(tiles, coords) {
        let on = false;
        for(let tile of tiles) {
            const tileCoords = getElCoords(tile);
            if(inSamePlace(coords, tileCoords)) {
                console.log({coords, tileCoords});
                on = true;
                break;
            }
        }
        return on
       }

       function getElCoords(el) {
        return {
            x: parseInt(el.style.getPropertyValue('--x') || "0", 10),
            y: parseInt(el.style.getPropertyValue('--y') || "0", 10)
        }
       }

       function resetState() {
        state.commands = []
        state.bee = {x:0, y:0}
        state.gameState = "playing"
       }
       
       function render(state) {
            requestAnimationFrame(() => {
                programDisplay.innerHTML = ''
                bee.style.setProperty("--x", `${state.bee.x}`);
                bee.style.setProperty("--y", `${state.bee.y}`);
                for(let command of state.commands) {
                    let commandDisp = document.createElement('div')
                    commandDisp.innerHTML = dirs[command]
                    programDisplay.append(commandDisp)    
                }
                finishMessage.classList.toggle("hidden", state.gameState == "playing");
                if(state.gameState != "playing") {
                    
                    finishMessage.querySelector('[data-field="gameState"]').innerText = state.gameState
                }
            })
       }
    }

    connectedCallback() {
        //implementation
    }

    disconnectedCallback() {
        //implementation
    }

    attributeChangedCallback(name, oldVal, newVal) {
        //implementation
    }

    adoptedCallback() {
        //implementation
    }

}

window.customElements.define('bee-game', BeeGame);