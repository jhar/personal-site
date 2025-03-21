


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
  };
}

////////////// APP ///////////////////

let loopFunc;



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

