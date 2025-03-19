const namespace = "http://www.w3.org/2000/svg";

function isTyped(el) {
  return el._type && el._type === "SVG_Creator_Element";
}

function _compose(el, target, method) {
  if (!el || !target || !method) return null;
  if (isTyped(target)) {
    target = target.el;
  }

  switch (method) {
    case "appendChild":
      return target.appendChild(el);

    case "replaceWith":
      return target.replaceWith(el);

    default:
      return null;
  }
}

function _addEvent(el, type, callback) {
  el.addEventListener(type, callback);
}

function getHeight(el) {
  if (el === globalThis) return el.innerHeight;
  if (isTyped(el) && el.height) return el.height;
  if (el.clientHeight) return el.clientHeight;
  return null;
}

function getWidth(el) {
  if (el === globalThis) return el.innerWidth;
  if (isTyped(el) && el.width) {
    return el.width;
  } else {
    if (el.clientHeight) return el.clientHeight;
    return null;
  }
}

function getCenterX(el) {
  let width = getWidth(el);
  if (typeof width === "string") {
    if (width.includes("%")) {
      return console.error("Cannot get center of percent.");
    }

    width = Number(width);
  }
  return width / 2;
}

function getCenterY(el) {
  let height = getHeight(el);
  if (typeof height === "string") {
    if (height.includes("%")) {
      return console.error("Cannot get center of percent.");
    }

    height = Number(height);
  }
  return height / 2;
}

function getOrientation(el) {
  const { w, h } = { w: getWidth(el), h: getHeight(el) };
  if (w < h) return "LANDSCAPE";
  if (w > h) return "PORTRAIT";
  return "SQUARE";
}

function _set(el, attr, val) {
  if (!el || !attr || !val) return; // Fails silently
  el.setAttribute(attr, val);
}

function create(params) {
  const {
    appendTo,
    cx,
    cy,
    el,
    fill,
    height,
    id,
    onClick,
    onKeyPress,
    r,
    replace,
    style,
    text,
    width,
    viewBox,
    x,
    y,
  } = params;

  // Input validation
  !el && console.error("createSVG(params): requires params.el");

  const svg = document.createElementNS(namespace, el);
  text && svg.appendChild(document.createTextNode(text));

  // Currying
  const set = (attr, val) => _set(svg, attr, val);
  const compose = (target, method) => _compose(svg, target, method);
  const addEvent = (type, callback) => _addEvent(svg, type, callback);

  // Set attributes
  set("id", id);
  set("width", width);
  set("height", height);
  set("style", style);

  if (el === "svg") {
    set("viewBox", viewBox);
    set("xmlns", namespace);
  } else {
    set("fill", fill);
  }

  set("x", x);
  set("y", y);

  if (el === "circle") {
    set("cx", cx);
    set("cy", cy);
    set("r", r);
  }

  compose(appendTo, "appendChild");
  compose(replace, "replaceWith");
  addEvent("click", onClick);
  addEvent("keypress", onKeyPress);

  return {
    ...params,
    el: svg,
    elType: params.el,
    parent: appendTo || undefined,
    _type: "SVG_Creator_Element",
  };
}

////////////// APP ///////////////////
let time = 0;
let score = 0;
let direction = "down";
let xOff = 1;
let yOff = 1;
let grubX = null;
let grubY = null;
const myBody = [];
let loop;
let loopFunc;
let paused = false;

const randomize = (max) => Math.floor(Math.random() * Math.floor(max - 8));

function newGrub(container) {
  const x = randomize(container.width);
  grubX = x + 4;
  const y = randomize(container.height);
  grubY = y + 4;
  create({
    id: `grub${score}`,
    el: "circle",
    fill: "red",
    cx: `${grubX}`,
    cy: `${grubY}`,
    r: "4",
    appendTo: container,
  });
}

function newScore(container) {
  create({
    id: `score${score}`,
    el: "text",
    fill: "black",
    x: `${globalThis.innerWidth / 2 - 96}`,
    y: "20",
    appendTo: container,
    text: `Score: ${score} --- Controls: WASD, Press P to pause.`,
  });
}

function gameOver(container) {
  create({
    el: "text",
    fill: "red",
    x: `${globalThis.innerWidth / 2 - 96}`,
    y: 96,
    appendTo: container,
    text: "GAME OVER",
  });

  clearInterval(loop);
}

function pause(container) {
  if (paused) {
    document.getElementById("pause").remove();
    loop = setInterval(loopFunc, 42);
    paused = false;
  } else {
    create({
      id: "pause",
      el: "text",
      fill: "blue",
      x: `${globalThis.innerWidth / 2}`,
      y: `${globalThis.innerHeight / 2}`,
      appendTo: container,
      text: "PAUSED",
    });

    clearInterval(loop);
    paused = true;
  }
}

function collisionDetection(a, b, bool, container) {
  const offset = bool ? 8 : 4;
  if (a.x > (b.x - offset)) {
    if (a.x < (b.x + offset)) {
      if (a.y > (b.y - offset)) {
        if (a.y < (b.y + offset)) {
          if (bool) {
            document.getElementById(`grub${score}`).remove();
            document.getElementById(`score${score}`).remove();
            score = score + 1;
            newGrub(container);
            newScore(container);
          } else {
            gameOver(container);
          }
        }
      }
    }
  }
}

(() => {
  console.log("hasdflkasjdf");
  const container = create({
    el: "svg",
    width: `${globalThis.innerWidth}`,
    height: `${globalThis.innerHeight}`,
    replace: document.getElementById("target-container").firstChild,
  });

  newGrub(container);
  newScore(container);

  document.addEventListener("keypress", (event) => {
    console.info(`event key: ${event.key}`);
    switch (event.key) {
      case "w":
        if (direction !== "down") {
          direction = "up";
        }

        return;

      case "a":
        if (direction !== "right") {
          direction = "left";
        }

        return;

      case "s":
        if (direction !== "up") {
          direction = "down";
        }

        return;

      case "d":
        if (direction !== "left") {
          direction = "right";
        }

        return;

      case "p":
        return pause(container);

      default:
        return null;
    }
  });

  loopFunc = () => {
    time = time + 1;

    if (direction === "down") {
      yOff = yOff + 1;
    } else if (direction === "up") {
      yOff = yOff - 1;
    } else if (direction === "right") {
      xOff = xOff + 1;
    } else if (direction === "left") {
      xOff = xOff - 1;
    }

    const newCircle = create({
      id: `${time}`,
      el: "circle",
      fill: "blue",
      cx: `${xOff * 8}`,
      cy: `${yOff * 8}`,
      r: "4",
      appendTo: container,
    });

    const me = {
      x: Number(newCircle.cx),
      y: Number(newCircle.cy),
    };

    collisionDetection(me, { x: grubX, y: grubY }, true, container);
    myBody.forEach((oldMe) => collisionDetection(me, oldMe, false, container));
    myBody.push(me);

    if (time > (3 + score)) {
      let id = `${time - (3 + score)}`;
      document.getElementById(id).remove();
      myBody.shift();
    }
  };

  loop = setInterval(loopFunc, 42);
})();
