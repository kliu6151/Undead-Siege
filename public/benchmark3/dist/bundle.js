(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
'use strict';

var width = 256;// each RC4 output is 0 <= x < 256
var chunks = 6;// at least six RC4 outputs for each double
var digits = 52;// there are 52 significant digits in a double
var pool = [];// pool: entropy pool starts empty
var GLOBAL = typeof global === 'undefined' ? window : global;

//
// The following constants are related to IEEE 754 limits.
//
var startdenom = Math.pow(width, chunks),
    significance = Math.pow(2, digits),
    overflow = significance * 2,
    mask = width - 1;


var oldRandom = Math.random;

//
// seedrandom()
// This is the seedrandom function described above.
//
module.exports = function(seed, options) {
  if (options && options.global === true) {
    options.global = false;
    Math.random = module.exports(seed, options);
    options.global = true;
    return Math.random;
  }
  var use_entropy = (options && options.entropy) || false;
  var key = [];

  // Flatten the seed string or build one from local entropy if needed.
  var shortseed = mixkey(flatten(
    use_entropy ? [seed, tostring(pool)] :
    0 in arguments ? seed : autoseed(), 3), key);

  // Use the seed to initialize an ARC4 generator.
  var arc4 = new ARC4(key);

  // Mix the randomness into accumulated entropy.
  mixkey(tostring(arc4.S), pool);

  // Override Math.random

  // This function returns a random double in [0, 1) that contains
  // randomness in every bit of the mantissa of the IEEE 754 value.

  return function() {         // Closure to return a random double:
    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
        d = startdenom,                 //   and denominator d = 2 ^ 48.
        x = 0;                          //   and no 'extra last byte'.
    while (n < significance) {          // Fill up all significant digits by
      n = (n + x) * width;              //   shifting numerator and
      d *= width;                       //   denominator and generating a
      x = arc4.g(1);                    //   new least-significant-byte.
    }
    while (n >= overflow) {             // To avoid rounding up, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer Math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  };
};

module.exports.resetGlobal = function () {
  Math.random = oldRandom;
};

//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//
/** @constructor */
function ARC4(key) {
  var t, keylen = key.length,
      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  // The empty key [] is treated as [0].
  if (!keylen) { key = [keylen++]; }

  // Set up S using the standard key scheduling algorithm.
  while (i < width) {
    s[i] = i++;
  }
  for (i = 0; i < width; i++) {
    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
    s[j] = t;
  }

  // The "g" method returns the next (count) outputs as one number.
  (me.g = function(count) {
    // Using instance members instead of closure state nearly doubles speed.
    var t, r = 0,
        i = me.i, j = me.j, s = me.S;
    while (count--) {
      t = s[i = mask & (i + 1)];
      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
    }
    me.i = i; me.j = j;
    return r;
    // For robust unpredictability discard an initial batch of values.
    // See http://www.rsa.com/rsalabs/node.asp?id=2009
  })(width);
}

//
// flatten()
// Converts an object tree to nested arrays of strings.
//
function flatten(obj, depth) {
  var result = [], typ = (typeof obj)[0], prop;
  if (depth && typ == 'o') {
    for (prop in obj) {
      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
    }
  }
  return (result.length ? result : typ == 's' ? obj : obj + '\0');
}

//
// mixkey()
// Mixes a string seed into a key that is an array of integers, and
// returns a shortened string seed that is equivalent to the result key.
//
function mixkey(seed, key) {
  var stringseed = seed + '', smear, j = 0;
  while (j < stringseed.length) {
    key[mask & j] =
      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  }
  return tostring(key);
}

//
// autoseed()
// Returns an object for autoseeding, using window.crypto if available.
//
/** @param {Uint8Array=} seed */
function autoseed(seed) {
  try {
    GLOBAL.crypto.getRandomValues(seed = new Uint8Array(width));
    return tostring(seed);
  } catch (e) {
    return [+new Date, GLOBAL, GLOBAL.navigator && GLOBAL.navigator.plugins,
            GLOBAL.screen, tostring(pool)];
  }
}

//
// tostring()
// Converts an array of charcodes to a string
//
function tostring(a) {
  return String.fromCharCode.apply(0, a);
}

//
// When seedrandom.js is loaded, we immediately mix a few bits
// from the built-in RNG into the entropy pool.  Because we do
// not want to intefere with determinstic PRNG state later,
// seedrandom will not call Math.random on its own again after
// initialization.
//
mixkey(Math.random(), pool);

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
/**
 * A manager class for all of the AI in a scene.
 * Keeps a list of registered actors and handles AI generation for actors.
 */
class AIManager {
    constructor() {
        this.actors = new Array();
        this.registeredAI = new Map_1.default();
    }
    /**
     * Registers an actor with the AIManager
     * @param actor The actor to register
     */
    registerActor(actor) {
        this.actors.push(actor);
    }
    removeActor(actor) {
        let index = this.actors.indexOf(actor);
        if (index !== -1) {
            this.actors.splice(index, 1);
        }
    }
    /**
     * Registers an AI with the AIManager for use later on
     * @param name The name of the AI to register
     * @param constr The constructor for the AI
     */
    registerAI(name, constr) {
        this.registeredAI.add(name, constr);
    }
    /**
     * Generates an AI instance from its name
     * @param name The name of the AI to add
     * @returns A new AI instance
     */
    generateAI(name) {
        if (this.registeredAI.has(name)) {
            return new (this.registeredAI.get(name))();
        }
        else {
            throw `Cannot create AI with name ${name}, no AI with that name is registered`;
        }
    }
    update(deltaT) {
        // Run the ai for every active actor
        this.actors.forEach(actor => { if (actor.aiActive)
            actor.ai.update(deltaT); });
    }
}
exports.default = AIManager;
},{"../DataTypes/Collections/Map":5}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StateMachine_1 = __importDefault(require("../DataTypes/State/StateMachine"));
/**
 * A version of a @reference[StateMachine] that is configured to work as an AI controller for a @reference[GameNode]
 */
class StateMachineAI extends StateMachine_1.default {
    // @implemented
    initializeAI(owner, config) { }
    // @implemented
    destroy() {
        // Get rid of our reference to the owner
        delete this.owner;
        this.receiver.destroy();
    }
    // @implemented
    activate(options) { }
}
exports.default = StateMachineAI;
},{"../DataTypes/State/StateMachine":21}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BinaryHeapSet {
    constructor(compareTo, maxElements = 100) {
        this.ROOT = 0;
        this.MAX_ELEMENTS = maxElements;
        this.heap = new Array(this.MAX_ELEMENTS);
        this.map = new Map();
        this.size = 0;
        this.comp = compareTo;
    }
    push(e) {
        if (!this.map.has(e)) {
            this.heap[this.size] = e;
            this.map.set(e, this.size);
            this.percup(this.size);
            this.size += 1;
        }
    }
    pop() {
        let top = this.peek();
        this.map.delete(this.heap[this.ROOT]);
        this.size -= 1;
        this.heap[this.ROOT] = this.heap[this.size];
        this.percdown(this.ROOT);
        return top;
    }
    peek() {
        return this.heap[this.ROOT];
    }
    isEmpty() {
        return this.size === 0;
    }
    forEach(func) {
        this.heap.forEach(func());
    }
    clear() {
        this.heap.fill(null);
    }
    restore(value) {
        let node = this.map.get(value);
        this.percup(node);
        this.percdown(node);
    }
    has(value) {
        return this.map.has(value);
    }
    toString() {
        let res = "Backing Heap: [";
        for (let i = 0; i < this.size; i++) {
            res += `${this.heap[i]}`;
            if (i < this.size - 1) {
                res += ", ";
            }
        }
        res += "]\nMap: [\n";
        this.map.forEach((val, key) => {
            res += `\t${key} -> ${val}\n`;
        });
        res += "]";
        return res;
    }
    percup(node) {
        let prnt = this.parent(node);
        while (node > this.ROOT && this.comp(this.heap[node], this.heap[prnt]) > 0) {
            this.swap(node, prnt);
            node = prnt;
            prnt = this.parent(node);
        }
    }
    percdown(node) {
        let child = this.lchild(node);
        while (child < this.size) {
            if (child < this.size - 1 && this.comp(this.heap[child], this.heap[child + 1]) <= 0) {
                child += 1;
            }
            if (this.comp(this.heap[child], this.heap[node]) > 0) {
                this.swap(node, child);
                node = child;
                child = this.lchild(node);
            }
            else {
                break;
            }
        }
    }
    parent(node) {
        return Math.floor((node - 1) / 2);
    }
    lchild(node) {
        return node * 2 + 1;
    }
    rchild(node) {
        return node * 2 + 2;
    }
    swap(node1, node2) {
        this.map.set(this.heap[node1], node2);
        this.map.set(this.heap[node2], node1);
        let temp = this.heap[node1];
        this.heap[node1] = this.heap[node2];
        this.heap[node2] = temp;
    }
}
exports.default = BinaryHeapSet;
},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Associates strings with elements of type T
 */
class Map {
    /** Creates a new map */
    constructor() {
        this.map = {};
    }
    /**
     * Adds a value T stored at a key.
     * @param key The key of the item to be stored
     * @param value The item to be stored
     */
    add(key, value) {
        this.map[key] = value;
    }
    /**
     * Get the value associated with a key.
     * @param key The key of the item
     * @returns The item at the key or undefined
     */
    get(key) {
        return this.map[key];
    }
    /**
     * An alias of add. Sets the value stored at key to the new specified value
     * @param key The key of the item to be stored
     * @param value The item to be stored
     */
    set(key, value) {
        this.add(key, value);
    }
    /**
     * Returns true if there is a value stored at the specified key, false otherwise.
     * @param key The key to check
     * @returns A boolean representing whether or not there is an item at the given key.
     */
    has(key) {
        return this.map[key] !== undefined;
    }
    /**
     * Returns an array of all of the keys in this map.
     * @returns An array containing all keys in the map.
     */
    keys() {
        return Object.keys(this.map);
    }
    // @implemented
    forEach(func) {
        Object.keys(this.map).forEach(key => func(key));
    }
    /**
     * Deletes an item associated with a key
     * @param key The key at which to delete an item
     */
    delete(key) {
        delete this.map[key];
    }
    // @implemented
    clear() {
        this.forEach(key => delete this.map[key]);
    }
    /**
     * Converts this map to a string representation.
     * @returns The string representation of this map.
     */
    toString() {
        let str = "";
        this.forEach((key) => str += key + " -> " + this.get(key).toString() + "\n");
        return str;
    }
}
exports.default = Map;
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A FIFO queue with elements of type T
 */
class Queue {
    /**
     * Constructs a new queue
     * @param maxElements The maximum size of the stack
     */
    constructor(maxElements = 100) {
        this.MAX_ELEMENTS = maxElements;
        this.q = new Array(this.MAX_ELEMENTS);
        this.head = 0;
        this.tail = 0;
        this.size = 0;
    }
    /**
     * Adds an item to the back of the queue
     * @param item The item to add to the back of the queue
     */
    enqueue(item) {
        if ((this.tail + 1) % this.MAX_ELEMENTS === this.head) {
            throw new Error("Queue full - cannot add element");
        }
        this.size += 1;
        this.q[this.tail] = item;
        this.tail = (this.tail + 1) % this.MAX_ELEMENTS;
    }
    /**
     * Retrieves an item from the front of the queue
     * @returns The item at the front of the queue
     */
    dequeue() {
        if (this.head === this.tail) {
            throw new Error("Queue empty - cannot remove element");
        }
        this.size -= 1;
        let item = this.q[this.head];
        // Now delete the item
        delete this.q[this.head];
        this.head = (this.head + 1) % this.MAX_ELEMENTS;
        return item;
    }
    /**
     * Returns the item at the front of the queue, but does not remove it
     * @returns The item at the front of the queue
     */
    peekNext() {
        if (this.head === this.tail) {
            throw "Queue empty - cannot get element";
        }
        let item = this.q[this.head];
        return item;
    }
    /**
     * Returns true if the queue has items in it, false otherwise
     * @returns A boolean representing whether or not this queue has items
     */
    hasItems() {
        return this.head !== this.tail;
    }
    /**
     * Returns the number of elements in the queue.
     * @returns The size of the queue
     */
    getSize() {
        return this.size;
    }
    // @implemented
    clear() {
        this.forEach((item, index) => delete this.q[index]);
        this.size = 0;
        this.head = this.tail;
    }
    // @implemented
    forEach(func) {
        let i = this.head;
        while (i !== this.tail) {
            func(this.q[i], i);
            i = (i + 1) % this.MAX_ELEMENTS;
        }
    }
    /**
     * Converts this queue into a string format
     * @returns A string representing this queue
     */
    toString() {
        let retval = "";
        this.forEach((item, index) => {
            let str = item.toString();
            if (index !== 0) {
                str += " -> ";
            }
            retval = str + retval;
        });
        return "Top -> " + retval;
    }
}
exports.default = Queue;
},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A LIFO stack with items of type T
 */
class Stack {
    /**
     * Constructs a new stack
     * @param maxElements The maximum size of the stack
     */
    constructor(maxElements = 100) {
        this.MAX_ELEMENTS = maxElements;
        this.stack = new Array(this.MAX_ELEMENTS);
        this.head = -1;
    }
    /**
     * Adds an item to the top of the stack
     * @param item The new item to add to the stack
     */
    push(item) {
        if (this.head + 1 === this.MAX_ELEMENTS) {
            throw "Stack full - cannot add element";
        }
        this.head += 1;
        this.stack[this.head] = item;
    }
    /**
     * Removes an item from the top of the stack
     * @returns The item at the top of the stack
     */
    pop() {
        if (this.head === -1) {
            throw "Stack empty - cannot remove element";
        }
        this.head -= 1;
        return this.stack[this.head + 1];
    }
    /**
     * Returns the element currently at the top of the stack
     * @returns The item at the top of the stack
     */
    peek() {
        if (this.head === -1) {
            throw "Stack empty - cannot get element";
        }
        return this.stack[this.head];
    }
    /** Returns true if this stack is empty
     * @returns A boolean that represents whether or not the stack is empty
    */
    isEmpty() {
        return this.head === -1;
    }
    // @implemented
    clear() {
        this.forEach((item, index) => delete this.stack[index]);
        this.head = -1;
    }
    /**
     * Returns the number of items currently in the stack
     * @returns The number of items in the stack
     */
    size() {
        return this.head + 1;
    }
    // @implemented
    forEach(func) {
        let i = 0;
        while (i <= this.head) {
            func(this.stack[i], i);
            i += 1;
        }
    }
    /**
     * Converts this stack into a string format
     * @returns A string representing this stack
     */
    toString() {
        let retval = "";
        this.forEach((item, index) => {
            let str = item.toString();
            if (index !== 0) {
                str += " -> ";
            }
            retval = str + retval;
        });
        return "Top -> " + retval;
    }
}
exports.default = Stack;
},{}],8:[function(require,module,exports){
"use strict";
// @ignorePage
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A placeholder function for No Operation. Does nothing
 */
const NullFunc = () => { };
exports.default = NullFunc;
},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A linked-list for the edges in a @reference[Graph].
 */
class EdgeNode {
    /**
     * Creates a new EdgeNode
     * @param index The index of the node this edge connects to
     * @param weight The weight of this edge
     */
    constructor(index, weight) {
        this.y = index;
        this.next = null;
        this.weight = weight ? weight : 1;
    }
}
exports.default = EdgeNode;
},{}],10:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_V = void 0;
const EdgeNode_1 = __importDefault(require("./EdgeNode"));
exports.MAX_V = 10000;
/**
 * An implementation of a graph data structure using edge lists. Inspired by The Algorithm Design Manual.
 */
class Graph {
    /**
     * Constructs a new graph
     * @param directed Whether or not this graph is directed
     */
    constructor(directed = false) {
        this.directed = directed;
        this.weighted = false;
        this.numVertices = 0;
        this.numEdges = 0;
        this.edges = new Array(exports.MAX_V);
        this.degree = new Array(exports.MAX_V);
    }
    /** Adds a node to this graph and returns the index of it
     * @returns The index of the new node
    */
    addNode() {
        return this.numVertices++;
    }
    /** Adds an edge between node x and y, with an optional weight
     * @param x The index of the start of the edge
     * @param y The index of the end of the edge
     * @param weight The optional weight of the new edge
    */
    addEdge(x, y, weight) {
        let edge = new EdgeNode_1.default(y, weight);
        if (this.edges[x]) {
            edge.next = this.edges[x];
        }
        this.edges[x] = edge;
        if (!this.directed) {
            edge = new EdgeNode_1.default(x, weight);
            if (this.edges[y]) {
                edge.next = this.edges[y];
            }
            this.edges[y] = edge;
        }
        this.numEdges += 1;
    }
    /**
     * Checks whether or not an edge exists between two nodes.
     * This check is directional if this is a directed graph.
     * @param x The first node
     * @param y The second node
     * @returns true if an edge exists, false otherwise
     */
    edgeExists(x, y) {
        let edge = this.edges[x];
        while (edge !== null) {
            if (edge.y === y) {
                return true;
            }
            edge = edge.next;
        }
    }
    /**
     * Gets the edge list associated with node x
     * @param x The index of the node
     * @returns The head of a linked-list of edges
     */
    getEdges(x) {
        return this.edges[x];
    }
    /**
     * Gets the degree associated with node x
     * @param x The index of the node
     */
    getDegree(x) {
        return this.degree[x];
    }
    /**
     * Converts the specifed node into a string
     * @param index The index of the node to convert to a string
     * @returns The string representation of the node: "Node x"
     */
    nodeToString(index) {
        return "Node " + index;
    }
    /**
     * Converts the Graph into a string format
     * @returns The graph as a string
     */
    toString() {
        let retval = "";
        for (let i = 0; i < this.numVertices; i++) {
            let edge = this.edges[i];
            let edgeStr = "";
            while (edge !== undefined && edge !== null) {
                edgeStr += edge.y.toString();
                if (this.weighted) {
                    edgeStr += " (" + edge.weight + ")";
                }
                if (edge.next !== null) {
                    edgeStr += ", ";
                }
                edge = edge.next;
            }
            retval += this.nodeToString(i) + ": " + edgeStr + "\n";
        }
        return retval;
    }
}
exports.default = Graph;
},{"./EdgeNode":9}],11:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graph_1 = __importStar(require("./Graph"));
/**
 * An extension of Graph that has nodes with positions in 2D space.
 * This is a weighted graph (though not inherently directd)
*/
class PositionGraph extends Graph_1.default {
    /**
     * Createes a new PositionGraph
     * @param directed Whether or not this graph is directed
     */
    constructor(directed = false) {
        super(directed);
        this.debugRender = () => {
            // for(let point of this.positions){
            // 	ctx.fillRect((point.x - origin.x - 4)*zoom, (point.y - origin.y - 4)*zoom, 8, 8);
            // }
        };
        this.positions = new Array(Graph_1.MAX_V);
    }
    /**
     * Adds a positioned node to this graph
     * @param position The position of the node to add
     * @returns The index of the added node
     */
    addPositionedNode(position) {
        this.positions[this.numVertices] = position;
        return this.addNode();
    }
    /**
     * Changes the position of a node.
     * Automatically adjusts the weights of the graph tied to this node.
     * As such, be warned that this function has an O(n + m) running time, and use it sparingly.
     * @param index The index of the node
     * @param position The new position of the node
     */
    setNodePosition(index, position) {
        this.positions[index] = position;
        // Recalculate all weights associated with this index
        for (let i = 0; i < this.numEdges; i++) {
            let edge = this.edges[i];
            while (edge !== null) {
                // If this node is on either side of the edge, recalculate weight
                if (i === index || edge.y === index) {
                    edge.weight = this.positions[i].distanceTo(this.positions[edge.y]);
                }
                edge = edge.next;
            }
        }
    }
    /**
     * Gets the position of a node
     * @param index The index of the node
     * @returns The position of the node
     */
    getNodePosition(index) {
        return this.positions[index];
    }
    /**
     * Adds an edge to this graph between node x and y.
     * Automatically calculates the weight of the edge as the distance between the nodes.
     * @param x The beginning of the edge
     * @param y The end of the edge
     */
    addEdge(x, y) {
        if (!this.positions[x] || !this.positions[y]) {
            throw "Can't add edge to un-positioned node!";
        }
        // Weight is the distance between the nodes
        let weight = this.positions[x].distanceTo(this.positions[y]);
        super.addEdge(x, y, weight);
    }
    // @override
    nodeToString(index) {
        return "Node " + index + " - " + this.positions[index].toString();
    }
    /**
     * Finds the node in the graph with the position closest to the given position
     * @param position the position
     * @returns the node in the graph that is closest to the given position
     */
    snap(position) {
        let n = this.numVertices;
        let i = 1;
        let index = 0;
        let dist = position.distanceSqTo(this.positions[0]);
        while (i < n) {
            let d = position.distanceSqTo(this.positions[i]);
            if (d < dist) {
                dist = d;
                index = i;
            }
            i++;
        }
        return index;
    }
}
exports.default = PositionGraph;
},{"./Graph":10}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRegion = void 0;
function isRegion(arg) {
    return arg && arg.size && arg.scale && arg.boundary;
}
exports.isRegion = isRegion;
},{}],13:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("./Vec2"));
/** A 4x4 matrix0 */
class Mat4x4 {
    constructor() {
        this.mat = new Float32Array([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);
    }
    // Static members
    static get IDENTITY() {
        return new Mat4x4().identity();
    }
    static get ZERO() {
        return new Mat4x4().zero();
    }
    // Accessors
    set _00(x) {
        this.mat[0] = x;
    }
    set(col, row, value) {
        if (col < 0 || col > 3 || row < 0 || row > 3) {
            throw `Error - index (${col}, ${row}) is out of bounds for Mat4x4`;
        }
        this.mat[row * 4 + col] = value;
        return this;
    }
    get(col, row) {
        return this.mat[row * 4 + col];
    }
    setAll(...items) {
        this.mat.set(items);
        return this;
    }
    identity() {
        return this.setAll(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    zero() {
        return this.setAll(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
    /**
     * Makes this Mat4x4 a rotation matrix of the specified number of radians ccw
     * @param zRadians The number of radians to rotate
     * @returns this Mat4x4
     */
    rotate(zRadians) {
        return this.setAll(Math.cos(zRadians), -Math.sin(zRadians), 0, 0, Math.sin(zRadians), Math.cos(zRadians), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    /**
     * Turns this Mat4x4 into a translation matrix of the specified translation
     * @param translation The translation in x and y
     * @returns this Mat4x4
     */
    translate(translation) {
        // If translation is a vec, get its array
        if (translation instanceof Vec2_1.default) {
            translation = translation.toArray();
        }
        return this.setAll(1, 0, 0, translation[0], 0, 1, 0, translation[1], 0, 0, 1, 0, 0, 0, 0, 1);
    }
    scale(scale) {
        // Make sure scale is a float32Array
        if (scale instanceof Vec2_1.default) {
            scale = scale.toArray();
        }
        else if (!(scale instanceof Float32Array)) {
            scale = new Float32Array([scale, scale]);
        }
        return this.setAll(scale[0], 0, 0, 0, 0, scale[1], 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
    }
    /**
     * Returns a new Mat4x4 that represents the right side multiplication THIS x OTHER
     * @param other The other Mat4x4 to multiply by
     * @returns a new Mat4x4 containing the product of these two Mat4x4s
     */
    mult(other, out) {
        let temp = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let value = 0;
                for (let k = 0; k < 4; k++) {
                    value += this.get(k, i) * other.get(j, k);
                }
                temp[j * 4 + i] = value;
            }
        }
        if (out !== undefined) {
            return out.setAll(...temp);
        }
        else {
            return new Mat4x4().setAll(...temp);
        }
    }
    /**
     * Multiplies all given matricies in order. e.g. MULT(A, B, C) -> A*B*C
     * @param mats A list of Mat4x4s to multiply in order
     * @returns A new Mat4x4 holding the result of the operation
     */
    static MULT(...mats) {
        // Create a new array
        let temp = Mat4x4.IDENTITY;
        // Multiply by every array in order, in place
        for (let i = 0; i < mats.length; i++) {
            temp.mult(mats[i], temp);
        }
        return temp;
    }
    toArray() {
        return this.mat;
    }
    toString() {
        return `|${this.mat[0].toFixed(2)}, ${this.mat[1].toFixed(2)}, ${this.mat[2].toFixed(2)}, ${this.mat[3].toFixed(2)}|\n` +
            `|${this.mat[4].toFixed(2)}, ${this.mat[5].toFixed(2)}, ${this.mat[6].toFixed(2)}, ${this.mat[7].toFixed(2)}|\n` +
            `|${this.mat[8].toFixed(2)}, ${this.mat[9].toFixed(2)}, ${this.mat[10].toFixed(2)}, ${this.mat[11].toFixed(2)}|\n` +
            `|${this.mat[12].toFixed(2)}, ${this.mat[13].toFixed(2)}, ${this.mat[14].toFixed(2)}, ${this.mat[15].toFixed(2)}|`;
    }
}
exports.default = Mat4x4;
},{"./Vec2":23}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A class that contains the area of overlap of two colliding objects to allow for sorting by the physics system.
 */
class AreaCollision {
    /**
     * Creates a new AreaCollision object
     * @param area The area of the collision
     * @param collider The other collider
     */
    constructor(area, collider, other, type, tile) {
        this.area = area;
        this.collider = collider;
        this.other = other;
        this.type = type;
        this.tile = tile;
    }
}
exports.default = AreaCollision;
},{}],15:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../Vec2"));
/**
 * An object representing the data collected from a physics hit between two geometric objects.
 * Inspired by the helpful collision documentation @link(here)(https://noonat.github.io/intersect/).
 */
class Hit {
    constructor() {
        /** The near times of the collision */
        this.nearTimes = Vec2_1.default.ZERO;
        /** The position of the collision */
        this.pos = Vec2_1.default.ZERO;
        /** The overlap distance of the hit */
        this.delta = Vec2_1.default.ZERO;
        /** The normal vector of the hit */
        this.normal = Vec2_1.default.ZERO;
    }
}
exports.default = Hit;
},{"../Vec2":23}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** A container for info about a webGL shader program */
class WebGLProgramType {
    /**
     * Deletes this shader program
     */
    delete(gl) {
        // Clean up all aspects of this program
        if (this.program) {
            gl.deleteProgram(this.program);
        }
        if (this.vertexShader) {
            gl.deleteShader(this.vertexShader);
        }
        if (this.fragmentShader) {
            gl.deleteShader(this.fragmentShader);
        }
    }
}
exports.default = WebGLProgramType;
},{}],17:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Shape_1 = __importDefault(require("./Shape"));
const Vec2_1 = __importDefault(require("../Vec2"));
const MathUtils_1 = __importDefault(require("../../Utils/MathUtils"));
const Circle_1 = __importDefault(require("./Circle"));
const Hit_1 = __importDefault(require("../Physics/Hit"));
/**
 * An Axis-Aligned Bounding Box. In other words, a rectangle that is always aligned to the x-y grid.
 * Inspired by the helpful collision documentation @link(here)(https://noonat.github.io/intersect/).
 */
class AABB extends Shape_1.default {
    /**
     * Creates a new AABB
     * @param center The center of the AABB
     * @param halfSize The half size of the AABB - The distance from the center to an edge in x and y
     */
    constructor(center, halfSize) {
        super();
        this.center = center ? center : new Vec2_1.default(0, 0);
        this.halfSize = halfSize ? halfSize : new Vec2_1.default(0, 0);
    }
    /** Returns a point representing the top left corner of the AABB */
    get topLeft() {
        return new Vec2_1.default(this.left, this.top);
    }
    /** Returns a point representing the top right corner of the AABB */
    get topRight() {
        return new Vec2_1.default(this.right, this.top);
    }
    /** Returns a point representing the bottom left corner of the AABB */
    get bottomLeft() {
        return new Vec2_1.default(this.left, this.bottom);
    }
    /** Returns a point representing the bottom right corner of the AABB */
    get bottomRight() {
        return new Vec2_1.default(this.right, this.bottom);
    }
    // @override
    getBoundingRect() {
        return this.clone();
    }
    // @override
    getBoundingCircle() {
        let r = Math.max(this.hw, this.hh);
        return new Circle_1.default(this.center.clone(), r);
    }
    // @deprecated
    getHalfSize() {
        return this.halfSize;
    }
    // @deprecated
    setHalfSize(halfSize) {
        this.halfSize = halfSize;
    }
    // TODO - move these all to the Shape class
    /**
     * A simple boolean check of whether this AABB contains a point
     * @param point The point to check
     * @returns A boolean representing whether this AABB contains the specified point
     */
    containsPoint(point) {
        return point.x >= this.x - this.hw && point.x <= this.x + this.hw
            && point.y >= this.y - this.hh && point.y <= this.y + this.hh;
    }
    /**
     * A simple boolean check of whether this AABB contains a point
     * @param point The point to check
     * @returns A boolean representing whether this AABB contains the specified point
     */
    intersectPoint(point) {
        let dx = point.x - this.x;
        let px = this.hw - Math.abs(dx);
        if (px <= 0) {
            return false;
        }
        let dy = point.y - this.y;
        let py = this.hh - Math.abs(dy);
        if (py <= 0) {
            return false;
        }
        return true;
    }
    /**
     * A boolean check of whether this AABB contains a point with soft left and top boundaries.
     * In other words, if the top left is (0, 0), the point (0, 0) is not in the AABB
     * @param point The point to check
     * @returns A boolean representing whether this AABB contains the specified point
     */
    containsPointSoft(point) {
        return point.x > this.x - this.hw && point.x <= this.x + this.hw
            && point.y > this.y - this.hh && point.y <= this.y + this.hh;
    }
    /**
     * Returns the data from the intersection of this AABB with a line segment from a point in a direction
     * @param point The point that the line segment starts from
     * @param delta The direction and distance of the segment
     * @param padding Pads the AABB to make it wider for the intersection test
     * @returns The Hit object representing the intersection, or null if there was no intersection
     */
    intersectSegment(point, delta, padding) {
        let paddingX = padding ? padding.x : 0;
        let paddingY = padding ? padding.y : 0;
        let scaleX = 1 / delta.x;
        let scaleY = 1 / delta.y;
        let signX = MathUtils_1.default.sign(scaleX);
        let signY = MathUtils_1.default.sign(scaleY);
        let tnearx = scaleX * (this.x - signX * (this.hw + paddingX) - point.x);
        let tneary = scaleY * (this.y - signY * (this.hh + paddingY) - point.y);
        let tfarx = scaleX * (this.x + signX * (this.hw + paddingX) - point.x);
        let tfary = scaleY * (this.y + signY * (this.hh + paddingY) - point.y);
        if (tnearx > tfary || tneary > tfarx) {
            // We aren't colliding - we clear one axis before intersecting another
            return null;
        }
        let tnear = Math.max(tnearx, tneary);
        // Double check for NaNs
        if (tnearx !== tnearx) {
            tnear = tneary;
        }
        else if (tneary !== tneary) {
            tnear = tnearx;
        }
        let tfar = Math.min(tfarx, tfary);
        if (tnear === -Infinity) {
            return null;
        }
        if (tnear >= 1 || tfar <= 0) {
            return null;
        }
        // We are colliding
        let hit = new Hit_1.default();
        hit.time = MathUtils_1.default.clamp01(tnear);
        hit.nearTimes.x = tnearx;
        hit.nearTimes.y = tneary;
        if (tnearx > tneary) {
            // We hit on the left or right size
            hit.normal.x = -signX;
            hit.normal.y = 0;
        }
        else if (Math.abs(tnearx - tneary) < 0.0001) {
            // We hit on the corner
            hit.normal.x = -signX;
            hit.normal.y = -signY;
            hit.normal.normalize();
        }
        else {
            // We hit on the top or bottom
            hit.normal.x = 0;
            hit.normal.y = -signY;
        }
        hit.delta.x = (1.0 - hit.time) * -delta.x;
        hit.delta.y = (1.0 - hit.time) * -delta.y;
        hit.pos.x = point.x + delta.x * hit.time;
        hit.pos.y = point.y + delta.y * hit.time;
        return hit;
    }
    // @override
    overlaps(other) {
        if (other instanceof AABB) {
            return this.overlapsAABB(other);
        }
        throw "Overlap not defined between these shapes.";
    }
    /**
     * A simple boolean check of whether this AABB overlaps another
     * @param other The other AABB to check against
     * @returns True if this AABB overlaps the other, false otherwise
     */
    overlapsAABB(other) {
        let dx = other.x - this.x;
        let px = this.hw + other.hw - Math.abs(dx);
        if (px <= 0) {
            return false;
        }
        let dy = other.y - this.y;
        let py = this.hh + other.hh - Math.abs(dy);
        if (py <= 0) {
            return false;
        }
        return true;
    }
    /**
     * Determines whether these AABBs are JUST touching - not overlapping.
     * Vec2.x is -1 if the other is to the left, 1 if to the right.
     * Likewise, Vec2.y is -1 if the other is on top, 1 if on bottom.
     * @param other The other AABB to check
     * @returns The collision sides stored in a Vec2 if the AABBs are touching, null otherwise
     */
    touchesAABB(other) {
        let dx = other.x - this.x;
        let px = this.hw + other.hw - Math.abs(dx);
        let dy = other.y - this.y;
        let py = this.hh + other.hh - Math.abs(dy);
        // If one axis is just touching and the other is overlapping, true
        if ((px === 0 && py >= 0) || (py === 0 && px >= 0)) {
            let ret = new Vec2_1.default();
            if (px === 0) {
                ret.x = other.x < this.x ? -1 : 1;
            }
            if (py === 0) {
                ret.y = other.y < this.y ? -1 : 1;
            }
            return ret;
        }
        else {
            return null;
        }
    }
    /**
     * Determines whether these AABBs are JUST touching - not overlapping.
     * Also, if they are only touching corners, they are considered not touching.
     * Vec2.x is -1 if the other is to the left, 1 if to the right.
     * Likewise, Vec2.y is -1 if the other is on top, 1 if on bottom.
     * @param other The other AABB to check
     * @returns The side of the touch, stored as a Vec2, or null if there is no touch
     */
    touchesAABBWithoutCorners(other) {
        let dx = other.x - this.x;
        let px = this.hw + other.hw - Math.abs(dx);
        let dy = other.y - this.y;
        let py = this.hh + other.hh - Math.abs(dy);
        // If one axis is touching, and the other is strictly overlapping
        if ((px === 0 && py > 0) || (py === 0 && px > 0)) {
            let ret = new Vec2_1.default();
            if (px === 0) {
                ret.x = other.x < this.x ? -1 : 1;
            }
            else {
                ret.y = other.y < this.y ? -1 : 1;
            }
            return ret;
        }
        else {
            return null;
        }
    }
    /**
     * Calculates the area of the overlap between this AABB and another
     * @param other The other AABB
     * @returns The area of the overlap between the AABBs
     */
    overlapArea(other) {
        let leftx = Math.max(this.x - this.hw, other.x - other.hw);
        let rightx = Math.min(this.x + this.hw, other.x + other.hw);
        let dx = rightx - leftx;
        let lefty = Math.max(this.y - this.hh, other.y - other.hh);
        let righty = Math.min(this.y + this.hh, other.y + other.hh);
        let dy = righty - lefty;
        if (dx < 0 || dy < 0)
            return 0;
        return dx * dy;
    }
    /**
     * Moves and resizes this rect from its current position to the position specified
     * @param velocity The movement of the rect from its position
     * @param fromPosition A position specified to be the starting point of sweeping
     * @param halfSize The halfSize of the sweeping rect
     */
    sweep(velocity, fromPosition, halfSize) {
        if (!fromPosition) {
            fromPosition = this.center;
        }
        if (!halfSize) {
            halfSize = this.halfSize;
        }
        let centerX = fromPosition.x + velocity.x / 2;
        let centerY = fromPosition.y + velocity.y / 2;
        let minX = Math.min(fromPosition.x - halfSize.x, fromPosition.x + velocity.x - halfSize.x);
        let minY = Math.min(fromPosition.y - halfSize.y, fromPosition.y + velocity.y - halfSize.y);
        this.center.set(centerX, centerY);
        this.halfSize.set(centerX - minX, centerY - minY);
    }
    // @override
    clone() {
        return new AABB(this.center.clone(), this.halfSize.clone());
    }
    /**
     * Converts this AABB to a string format
     * @returns (center: (x, y), halfSize: (x, y))
     */
    toString() {
        return "(center: " + this.center.toString() + ", half-size: " + this.halfSize.toString() + ")";
    }
}
exports.default = AABB;
},{"../../Utils/MathUtils":107,"../Physics/Hit":15,"../Vec2":23,"./Circle":18,"./Shape":19}],18:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../Vec2"));
const AABB_1 = __importDefault(require("./AABB"));
const Shape_1 = __importDefault(require("./Shape"));
/**
 * A Circle
 */
class Circle extends Shape_1.default {
    /**
     * Creates a new Circle
     * @param center The center of the circle
     * @param radius The radius of the circle
     */
    constructor(center, radius) {
        super();
        this._center = center ? center : new Vec2_1.default(0, 0);
        this.radius = radius ? radius : 0;
    }
    get center() {
        return this._center;
    }
    set center(center) {
        this._center = center;
    }
    get halfSize() {
        return new Vec2_1.default(this.radius, this.radius);
    }
    get r() {
        return this.radius;
    }
    set r(radius) {
        this.radius = radius;
    }
    // @override
    /**
     * A simple boolean check of whether this AABB contains a point
     * @param point The point to check
     * @returns A boolean representing whether this AABB contains the specified point
     */
    containsPoint(point) {
        return this.center.distanceSqTo(point) <= this.radius * this.radius;
    }
    // @override
    getBoundingRect() {
        return new AABB_1.default(this._center.clone(), new Vec2_1.default(this.radius, this.radius));
    }
    // @override
    getBoundingCircle() {
        return this.clone();
    }
    // @override
    overlaps(other) {
        throw new Error("Method not implemented.");
    }
    // @override
    clone() {
        return new Circle(this._center.clone(), this.radius);
    }
    toString() {
        return "(center: " + this.center.toString() + ", radius: " + this.radius + ")";
    }
}
exports.default = Circle;
},{"../Vec2":23,"./AABB":17,"./Shape":19}],19:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../Vec2"));
const AABB_1 = __importDefault(require("./AABB"));
/**
 * An abstract Shape class that acts as an interface for better interactions with subclasses.
 */
class Shape {
    get x() {
        return this.center.x;
    }
    get y() {
        return this.center.y;
    }
    get hw() {
        return this.halfSize.x;
    }
    get hh() {
        return this.halfSize.y;
    }
    get top() {
        return this.y - this.hh;
    }
    get bottom() {
        return this.y + this.hh;
    }
    get left() {
        return this.x - this.hw;
    }
    get right() {
        return this.x + this.hw;
    }
    static getTimeOfCollision(A, velA, B, velB) {
        if (A instanceof AABB_1.default && B instanceof AABB_1.default) {
            return Shape.getTimeOfCollision_AABB_AABB(A, velA, B, velB);
        }
    }
    static getTimeOfCollision_AABB_AABB(A, velA, B, velB) {
        let posSmaller = A.center;
        let posLarger = B.center;
        let sizeSmaller = A.halfSize;
        let sizeLarger = B.halfSize;
        let firstContact = new Vec2_1.default(0, 0);
        let lastContact = new Vec2_1.default(0, 0);
        let collidingX = false;
        let collidingY = false;
        // Sort by position
        if (posLarger.x < posSmaller.x) {
            // Swap, because smaller is further right than larger
            let temp;
            temp = sizeSmaller;
            sizeSmaller = sizeLarger;
            sizeLarger = temp;
            temp = posSmaller;
            posSmaller = posLarger;
            posLarger = temp;
            temp = velA;
            velA = velB;
            velB = temp;
        }
        // A is left, B is right
        firstContact.x = Infinity;
        lastContact.x = Infinity;
        if (posLarger.x - sizeLarger.x >= posSmaller.x + sizeSmaller.x) {
            // If we aren't currently colliding
            let relVel = velA.x - velB.x;
            if (relVel > 0) {
                // If they are moving towards each other
                firstContact.x = ((posLarger.x - sizeLarger.x) - (posSmaller.x + sizeSmaller.x)) / (relVel);
                lastContact.x = ((posLarger.x + sizeLarger.x) - (posSmaller.x - sizeSmaller.x)) / (relVel);
            }
        }
        else {
            collidingX = true;
        }
        if (posLarger.y < posSmaller.y) {
            // Swap, because smaller is further up than larger
            let temp;
            temp = sizeSmaller;
            sizeSmaller = sizeLarger;
            sizeLarger = temp;
            temp = posSmaller;
            posSmaller = posLarger;
            posLarger = temp;
            temp = velA;
            velA = velB;
            velB = temp;
        }
        // A is top, B is bottom
        firstContact.y = Infinity;
        lastContact.y = Infinity;
        if (posLarger.y - sizeLarger.y >= posSmaller.y + sizeSmaller.y) {
            // If we aren't currently colliding
            let relVel = velA.y - velB.y;
            if (relVel > 0) {
                // If they are moving towards each other
                firstContact.y = ((posLarger.y - sizeLarger.y) - (posSmaller.y + sizeSmaller.y)) / (relVel);
                lastContact.y = ((posLarger.y + sizeLarger.y) - (posSmaller.y - sizeSmaller.y)) / (relVel);
            }
        }
        else {
            collidingY = true;
        }
        return [firstContact, lastContact, collidingX, collidingY];
    }
}
exports.default = Shape;
},{"../Vec2":23,"./AABB":17}],20:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Emitter_1 = __importDefault(require("../../Events/Emitter"));
/**
 * An abstract implementation of a state for a @reference[StateMachine].
 * This class should be extended to allow for custom state behaviors.
 */
class State {
    /**
     * Constructs a new State
     * @param parent The parent StateMachine of this state
     */
    constructor(parent) {
        this.parent = parent;
        this.emitter = new Emitter_1.default();
    }
    /**
     * Tells the state machine that this state has ended, and makes it transition to the new state specified
     * @param stateName The name of the state to transition to
     */
    finished(stateName) {
        this.parent.changeState(stateName);
    }
}
exports.default = State;
},{"../../Events/Emitter":26}],21:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stack_1 = __importDefault(require("../Collections/Stack"));
const Map_1 = __importDefault(require("../Collections/Map"));
const Receiver_1 = __importDefault(require("../../Events/Receiver"));
const Emitter_1 = __importDefault(require("../../Events/Emitter"));
/**
 * An implementation of a Push Down Automata State machine. States can also be hierarchical
 * for more flexibility, as described in @link(Game Programming Patterns)(https://gameprogrammingpatterns.com/state.html).
 */
class StateMachine {
    /**
     * Creates a new StateMachine
     */
    constructor() {
        this.stack = new Stack_1.default();
        this.stateMap = new Map_1.default();
        this.receiver = new Receiver_1.default();
        this.emitter = new Emitter_1.default();
        this.emitEventOnStateChange = false;
    }
    /**
     * Sets the activity state of this state machine
     * @param flag True if you want to set this machine running, false otherwise
     */
    setActive(flag) {
        this.active = flag;
    }
    /**
     * Makes this state machine emit an event any time its state changes
     * @param stateChangeEventName The name of the event to emit
     */
    setEmitEventOnStateChange(stateChangeEventName) {
        this.emitEventOnStateChange = true;
        this.stateChangeEventName = stateChangeEventName;
    }
    /**
     * Stops this state machine from emitting events on state change.
     */
    cancelEmitEventOnStateChange() {
        this.emitEventOnStateChange = false;
    }
    /**
     * Initializes this state machine with an initial state and sets it running
     * @param initialState The name of initial state of the state machine
     */
    initialize(initialState, options) {
        this.stack.push(this.stateMap.get(initialState));
        this.currentState = this.stack.peek();
        this.currentState.onEnter(options);
        this.setActive(true);
    }
    /**
     * Adds a state to this state machine
     * @param stateName The name of the state to add
     * @param state The state to add
     */
    addState(stateName, state) {
        this.stateMap.add(stateName, state);
    }
    /**
     * Changes the state of this state machine to the provided string
     * @param state The string name of the state to change to
     */
    changeState(state) {
        // Exit the current state
        let options = this.currentState.onExit();
        // Make sure the correct state is at the top of the stack
        if (state === "previous") {
            // Pop the current state off the stack
            this.stack.pop();
        }
        else {
            // Retrieve the new state from the statemap and put it at the top of the stack
            this.stack.pop();
            this.stack.push(this.stateMap.get(state));
        }
        // Retreive the new state from the stack
        this.currentState = this.stack.peek();
        // Emit an event if turned on
        if (this.emitEventOnStateChange) {
            this.emitter.fireEvent(this.stateChangeEventName, { state: this.currentState });
        }
        // Enter the new state
        this.currentState.onEnter(options);
    }
    /**
     * Handles input. This happens at the very beginning of this state machine's update cycle.
     * @param event The game event to process
     */
    handleEvent(event) {
        if (this.active) {
            this.currentState.handleInput(event);
        }
    }
    // @implemented
    update(deltaT) {
        // Distribute events
        while (this.receiver.hasNextEvent()) {
            let event = this.receiver.getNextEvent();
            this.handleEvent(event);
        }
        // Delegate the update to the current state
        this.currentState.update(deltaT);
    }
}
exports.default = StateMachine;
},{"../../Events/Emitter":26,"../../Events/Receiver":30,"../Collections/Map":5,"../Collections/Stack":7}],22:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const Vec2_1 = __importDefault(require("../Vec2"));
/**
 * The data representation of a Tileset for the game engine. This represents one image,
 * with a startIndex if required (as it is with Tiled using two images in one tilset).
 */
class Tileset {
    // TODO: Change this to be more general and work with other tileset formats
    constructor(tilesetData) {
        // Defer handling of the data to a helper class
        this.initFromTiledData(tilesetData);
    }
    /**
     * Initialize the tileset from the data from a Tiled json file
     * @param tiledData The parsed object from a Tiled json file
     */
    initFromTiledData(tiledData) {
        this.numRows = tiledData.tilecount / tiledData.columns;
        this.numCols = tiledData.columns;
        this.startIndex = tiledData.firstgid;
        this.endIndex = this.startIndex + tiledData.tilecount - 1;
        this.tileSize = new Vec2_1.default(tiledData.tilewidth, tiledData.tilewidth);
        this.imageKey = tiledData.image;
        this.imageSize = new Vec2_1.default(tiledData.imagewidth, tiledData.imageheight);
    }
    /**
     * Gets the image key associated with this tilemap
     * @returns The image key of this tilemap
     */
    getImageKey() {
        return this.imageKey;
    }
    /**
     * Returns a Vec2 containing the left and top offset from the image origin for this tile.
     * @param tileIndex The index of the tile from startIndex to endIndex of this tileset
     * @returns A Vec2 containing the offset for the specified tile.
     */
    getImageOffsetForTile(tileIndex) {
        // Get the true index
        let index = tileIndex - this.startIndex;
        let row = Math.floor(index / this.numCols);
        let col = index % this.numCols;
        let width = this.tileSize.x;
        let height = this.tileSize.y;
        // Calculate the position to start a crop in the tileset image
        let left = col * width;
        let top = row * height;
        return new Vec2_1.default(left, top);
    }
    /**
     * Gets the start index
     * @returns The start index
     */
    getStartIndex() {
        return this.startIndex;
    }
    /**
     * Gets the tile set
     * @returns A Vec2 containing the tile size
     */
    getTileSize() {
        return this.tileSize;
    }
    /**
     * Gets the number of rows in the tileset
     * @returns The number of rows
     */
    getNumRows() {
        return this.numRows;
    }
    /**
     * Gets the number of columns in the tilset
     * @returns The number of columns
     */
    getNumCols() {
        return this.numCols;
    }
    getTileCount() {
        return this.endIndex - this.startIndex + 1;
    }
    /**
     * Checks whether or not this tilset contains the specified tile index. This is used for rendering.
     * @param tileIndex The index of the tile to check
     * @returns A boolean representing whether or not this tilset uses the specified index
     */
    hasTile(tileIndex) {
        return tileIndex >= this.startIndex && tileIndex <= this.endIndex;
    }
    /**
     * Render a singular tile with index tileIndex from the tileset located at position dataIndex
     * @param ctx The rendering context
     * @param tileIndex The value of the tile to render
     * @param dataIndex The index of the tile in the data array
     * @param worldSize The size of the world
     * @param origin The viewport origin in the current layer
     * @param scale The scale of the tilemap
     */
    renderTile(ctx, tileIndex, dataIndex, maxCols, origin, scale, zoom) {
        let image = ResourceManager_1.default.getInstance().getImage(this.imageKey);
        // Get the true index
        let index = tileIndex - this.startIndex;
        let row = Math.floor(index / this.numCols);
        let col = index % this.numCols;
        let width = this.tileSize.x;
        let height = this.tileSize.y;
        // Calculate the position to start a crop in the tileset image
        let left = col * width;
        let top = row * height;
        // Calculate the position in the world to render the tile
        let x = Math.floor((dataIndex % maxCols) * width * scale.x);
        let y = Math.floor(Math.floor(dataIndex / maxCols) * height * scale.y);
        ctx.drawImage(image, left, top, width, height, Math.floor((x - origin.x) * zoom), Math.floor((y - origin.y) * zoom), Math.ceil(width * scale.x * zoom), Math.ceil(height * scale.y * zoom));
    }
}
exports.default = Tileset;
},{"../../ResourceManager/ResourceManager":88,"../Vec2":23}],23:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("../Utils/MathUtils"));
/**
 * A two-dimensional vector (x, y)
 */
class Vec2 {
    /**
     * Creates a new Vec2
     * @param x The x value of the vector
     * @param y The y value of the vector
     */
    constructor(x = 0, y = 0) {
        /**
         * When this vector changes its value, do something
         */
        this.onChange = () => { };
        this.vec = new Float32Array(2);
        this.vec[0] = x;
        this.vec[1] = y;
    }
    // Expose x and y with getters and setters
    get x() {
        return this.vec[0];
    }
    set x(x) {
        this.vec[0] = x;
        if (this.onChange) {
            this.onChange();
        }
    }
    get y() {
        return this.vec[1];
    }
    set y(y) {
        this.vec[1] = y;
        if (this.onChange) {
            this.onChange();
        }
    }
    static get ZERO() {
        return new Vec2(0, 0);
    }
    static get INF() {
        return new Vec2(Infinity, Infinity);
    }
    static get UP() {
        return new Vec2(0, -1);
    }
    static get DOWN() {
        return new Vec2(0, 1);
    }
    static get LEFT() {
        return new Vec2(-1, 0);
    }
    static get RIGHT() {
        return new Vec2(1, 0);
    }
    /**
     * The squared magnitude of the vector. This tends to be faster, so use it in situations where taking the
     * square root doesn't matter, like for comparing distances.
     * @returns The squared magnitude of the vector
     */
    magSq() {
        return this.x * this.x + this.y * this.y;
    }
    /**
     * The magnitude of the vector.
     * @returns The magnitude of the vector.
     */
    mag() {
        return Math.sqrt(this.magSq());
    }
    /**
     * Divdes x and y by the magnitude to obtain the unit vector in the direction of this vector.
     * @returns This vector as a unit vector.
     */
    normalize() {
        if (this.x === 0 && this.y === 0)
            return this;
        let mag = this.mag();
        this.x /= mag;
        this.y /= mag;
        return this;
    }
    /**
     * Works like normalize(), but returns a new Vec2
     * @returns A new vector that is the unit vector for this one
     */
    normalized() {
        if (this.isZero()) {
            return this;
        }
        let mag = this.mag();
        return new Vec2(this.x / mag, this.y / mag);
    }
    /**
     * Sets the x and y elements of this vector to zero.
     * @returns This vector, with x and y set to zero.
     */
    zero() {
        return this.set(0, 0);
    }
    /**
     * Sets the vector's x and y based on the angle provided. Goes counter clockwise.
     * @param angle The angle in radians
     * @param radius The magnitude of the vector at the specified angle
     * @returns This vector.
     */
    setToAngle(angle, radius = 1) {
        this.x = MathUtils_1.default.floorToPlace(Math.cos(angle) * radius, 5);
        this.y = MathUtils_1.default.floorToPlace(-Math.sin(angle) * radius, 5);
        return this;
    }
    /**
     * Returns a vector that point from this vector to another one
     * @param other The vector to point to
     * @returns A new Vec2 that points from this vector to the one provided
     */
    vecTo(other) {
        return new Vec2(other.x - this.x, other.y - this.y);
    }
    /**
     * Returns a vector containing the direction from this vector to another
     * @param other The vector to point to
     * @returns A new Vec2 that points from this vector to the one provided. This new Vec2 will be a unit vector.
     */
    dirTo(other) {
        return this.vecTo(other).normalize();
    }
    /**
     * Keeps the vector's direction, but sets its magnitude to be the provided magnitude
     * @param magnitude The magnitude the vector should be
     * @returns This vector with its magnitude set to the new magnitude
     */
    scaleTo(magnitude) {
        return this.normalize().scale(magnitude);
    }
    /**
     * Scales x and y by the number provided, or if two number are provided, scales them individually.
     * @param factor The scaling factor for the vector, or for only the x-component if yFactor is provided
     * @param yFactor The scaling factor for the y-component of the vector
     * @returns This vector after scaling
     */
    scale(factor, yFactor = null) {
        if (yFactor !== null) {
            this.x *= factor;
            this.y *= yFactor;
            return this;
        }
        this.x *= factor;
        this.y *= factor;
        return this;
    }
    /**
     * Returns a scaled version of this vector without modifying it.
     * @param factor The scaling factor for the vector, or for only the x-component if yFactor is provided
     * @param yFactor The scaling factor for the y-component of the vector
     * @returns A new vector that has the values of this vector after scaling
     */
    scaled(factor, yFactor = null) {
        return this.clone().scale(factor, yFactor);
    }
    /**
     * Rotates the vector counter-clockwise by the angle amount specified
     * @param angle The angle to rotate by in radians
     * @returns This vector after rotation.
     */
    rotateCCW(angle) {
        let cs = Math.cos(angle);
        let sn = Math.sin(angle);
        let tempX = this.x * cs - this.y * sn;
        let tempY = this.x * sn + this.y * cs;
        this.x = tempX;
        this.y = tempY;
        return this;
    }
    /**
     * Sets the vectors coordinates to be the ones provided
     * @param x The new x value for this vector
     * @param y The new y value for this vector
     * @returns This vector
     */
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    /**
     * Copies the values of the other Vec2 into this one.
     * @param other The Vec2 to copy
     * @returns This vector with its values set to the vector provided
     */
    copy(other) {
        return this.set(other.x, other.y);
    }
    /**
     * Adds this vector the another vector
     * @param other The Vec2 to add to this one
     * @returns This vector after adding the one provided
     */
    add(other) {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    /**
     * Increments the fields of this vector. Both are incremented with a, if only a is provided.
     * @param a The first number to increment by
     * @param b The second number to increment by
     * @returnss This vector after incrementing
     */
    inc(a, b) {
        if (b === undefined) {
            this.x += a;
            this.y += a;
        }
        else {
            this.x += a;
            this.y += b;
        }
        return this;
    }
    /**
     * Subtracts another vector from this vector
     * @param other The Vec2 to subtract from this one
     * @returns This vector after subtracting the one provided
     */
    sub(other) {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }
    /**
     * Multiplies this vector with another vector element-wise. In other words, this.x *= other.x and this.y *= other.y
     * @param other The Vec2 to multiply this one by
     * @returns This vector after multiplying its components by this one
     */
    mult(other) {
        this.x *= other.x;
        this.y *= other.y;
        return this;
    }
    /**
     * Divides this vector with another vector element-wise. In other words, this.x /= other.x and this.y /= other.y
     * @param other The vector to divide this one by
     * @returns This vector after division
     */
    div(other) {
        if (other.x === 0 || other.y === 0)
            throw "Divide by zero error";
        this.x /= other.x;
        this.y /= other.y;
        return this;
    }
    /**
     * Does an element wise remainder operation on this vector. this.x %= other.x and this.y %= other.y
     * @param other The other vector
     * @returns this vector
     */
    remainder(other) {
        this.x = this.x % other.x;
        this.y = this.y % other.y;
        return this;
    }
    /**
     * Returns the squared distance between this vector and another vector
     * @param other The vector to compute distance squared to
     * @returns The squared distance between this vector and the one provided
     */
    distanceSqTo(other) {
        return (this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y);
    }
    /**
     * Returns the distance between this vector and another vector
     * @param other The vector to compute distance to
     * @returns The distance between this vector and the one provided
     */
    distanceTo(other) {
        return Math.sqrt(this.distanceSqTo(other));
    }
    /**
     * Returns the dot product of this vector and another
     * @param other The vector to compute the dot product with
     * @returns The dot product of this vector and the one provided.
     */
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    /**
     * Returns the angle counter-clockwise in radians from this vector to another vector
     * @param other The vector to compute the angle to
     * @returns The angle, rotating CCW, from this vector to the other vector
     */
    angleToCCW(other) {
        let dot = this.dot(other);
        let det = this.x * other.y - this.y * other.x;
        let angle = -Math.atan2(det, dot);
        if (angle < 0) {
            angle += 2 * Math.PI;
        }
        return angle;
    }
    /**
     * Returns a string representation of this vector rounded to 1 decimal point
     * @returns This vector as a string
     */
    toString() {
        return this.toFixed();
    }
    /**
     * Returns a string representation of this vector rounded to the specified number of decimal points
     * @param numDecimalPoints The number of decimal points to create a string to
     * @returns This vector as a string
     */
    toFixed(numDecimalPoints = 1) {
        return "(" + this.x.toFixed(numDecimalPoints) + ", " + this.y.toFixed(numDecimalPoints) + ")";
    }
    /**
     * Returns a new vector with the same coordinates as this one.
     * @returns A new Vec2 with the same values as this one
     */
    clone() {
        return new Vec2(this.x, this.y);
    }
    /**
     * Returns true if this vector and other have the EXACT same x and y (not assured to be safe for floats)
     * @param other The vector to check against
     * @returns A boolean representing the equality of the two vectors
     */
    strictEquals(other) {
        return this.x === other.x && this.y === other.y;
    }
    /**
     * Returns true if this vector and other have the same x and y
     * @param other The vector to check against
     * @returns A boolean representing the equality of the two vectors
     */
    equals(other) {
        let xEq = Math.abs(this.x - other.x) < 0.0000001;
        let yEq = Math.abs(this.y - other.y) < 0.0000001;
        return xEq && yEq;
    }
    /**
     * Returns true if this vector is the zero vector exactly (not assured to be safe for floats).
     * @returns A boolean representing the equality of this vector and the zero vector
     */
    strictIsZero() {
        return this.x === 0 && this.y === 0;
    }
    /**
     * Returns true if this x and y for this vector are both zero.
     * @returns A boolean representing the equality of this vector and the zero vector
     */
    isZero() {
        return Math.abs(this.x) < 0.0000001 && Math.abs(this.y) < 0.0000001;
    }
    /**
     * Sets the function that is called whenever this vector is changed.
     * @param f The function to be called
     */
    setOnChange(f) {
        this.onChange = f;
    }
    toArray() {
        return this.vec;
    }
    /**
     * Performs linear interpolation between two vectors
     * @param a The first vector
     * @param b The second vector
     * @param t The time of the lerp, with 0 being vector A, and 1 being vector B
     * @returns A new Vec2 representing the lerp between vector a and b.
     */
    static lerp(a, b, t) {
        return new Vec2(MathUtils_1.default.lerp(a.x, b.x, t), MathUtils_1.default.lerp(a.y, b.y, t));
    }
}
exports.default = Vec2;
Vec2.ZERO_STATIC = new Vec2(0, 0);
},{"../Utils/MathUtils":107}],24:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const Color_1 = __importDefault(require("../Utils/Color"));
/**
 * A util class for rendering Debug messages to the canvas.
 */
class Debug {
    /**
     * Add a message to display on the debug screen
     * @param id A unique ID for this message
     * @param messages The messages to print to the debug screen
     */
    static log(id, ...messages) {
        // let message = "";
        // for(let i = 0; i < messages.length; i++){
        // 	message += messages[i].toString();
        // }
        // Join all messages with spaces
        let message = messages.map((m) => m.toString()).join(" ");
        this.logMessages.add(id, message);
    }
    /**
     * Deletes a a key from the log and stops it from keeping up space on the screen
     * @param id The id of the log item to clear
     */
    static clearLogItem(id) {
        this.logMessages.delete(id);
    }
    /**
     * Sets the list of nodes to render with the debugger
     * @param nodes The new list of nodes
     */
    static setNodes(nodes) {
        this.nodes = nodes;
    }
    /**
     * Draws a box at the specified position
     * @param center The center of the box
     * @param halfSize The dimensions of the box
     * @param filled A boolean for whether or not the box is filled
     * @param color The color of the box to draw
     */
    static drawBox(center, halfSize, filled, color) {
        let alpha = this.debugRenderingContext.globalAlpha;
        this.debugRenderingContext.globalAlpha = color.a;
        if (filled) {
            this.debugRenderingContext.fillStyle = color.toString();
            this.debugRenderingContext.fillRect(center.x - halfSize.x, center.y - halfSize.y, halfSize.x * 2, halfSize.y * 2);
        }
        else {
            let lineWidth = 2;
            this.debugRenderingContext.lineWidth = lineWidth;
            this.debugRenderingContext.strokeStyle = color.toString();
            this.debugRenderingContext.strokeRect(center.x - halfSize.x, center.y - halfSize.y, halfSize.x * 2, halfSize.y * 2);
        }
        this.debugRenderingContext.globalAlpha = alpha;
    }
    /**
     * Draws a circle at the specified position
     * @param center The center of the circle
     * @param radius The dimensions of the box
     * @param filled A boolean for whether or not the circle is filled
     * @param color The color of the circle
     */
    static drawCircle(center, radius, filled, color) {
        let alpha = this.debugRenderingContext.globalAlpha;
        this.debugRenderingContext.globalAlpha = color.a;
        if (filled) {
            this.debugRenderingContext.fillStyle = color.toString();
            this.debugRenderingContext.beginPath();
            this.debugRenderingContext.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            this.debugRenderingContext.closePath();
            this.debugRenderingContext.fill();
        }
        else {
            let lineWidth = 2;
            this.debugRenderingContext.lineWidth = lineWidth;
            this.debugRenderingContext.strokeStyle = color.toString();
            this.debugRenderingContext.beginPath();
            this.debugRenderingContext.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            this.debugRenderingContext.closePath();
            this.debugRenderingContext.stroke();
        }
        this.debugRenderingContext.globalAlpha = alpha;
    }
    /**
     * Draws a ray at the specified position
     * @param from The starting position of the ray
     * @param to The ending position of the ray
     * @param color The color of the ray
     */
    static drawRay(from, to, color) {
        this.debugRenderingContext.lineWidth = 2;
        this.debugRenderingContext.strokeStyle = color.toString();
        this.debugRenderingContext.beginPath();
        this.debugRenderingContext.moveTo(from.x, from.y);
        this.debugRenderingContext.lineTo(to.x, to.y);
        this.debugRenderingContext.closePath();
        this.debugRenderingContext.stroke();
    }
    /**
     * Draws a point at the specified position
     * @param pos The position of the point
     * @param color The color of the point
     */
    static drawPoint(pos, color) {
        let pointSize = 6;
        this.debugRenderingContext.fillStyle = color.toString();
        this.debugRenderingContext.fillRect(pos.x - pointSize / 2, pos.y - pointSize / 2, pointSize, pointSize);
    }
    /**
     * Sets the default rendering color for text for the debugger
     * @param color The color to render the text
     */
    static setDefaultTextColor(color) {
        this.defaultTextColor = color;
    }
    /**
     * Performs any necessary setup operations on the Debug canvas
     * @param canvas The debug canvas
     * @param width The desired width of the canvas
     * @param height The desired height of the canvas
     * @returns The rendering context extracted from the canvas
     */
    static initializeDebugCanvas(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
        this.debugCanvasSize = new Vec2_1.default(width, height);
        this.debugRenderingContext = canvas.getContext("2d");
        return this.debugRenderingContext;
    }
    /** Clears the debug canvas */
    static clearCanvas() {
        this.debugRenderingContext.clearRect(0, 0, this.debugCanvasSize.x, this.debugCanvasSize.y);
    }
    /** Renders the text and nodes sent to the Debug system */
    static render() {
        this.renderText();
        this.renderNodes();
    }
    /** Renders the text sent to the Debug canvas */
    static renderText() {
        let y = 20;
        this.debugRenderingContext.font = "20px Arial";
        this.debugRenderingContext.fillStyle = this.defaultTextColor.toString();
        // Draw all of the text
        this.logMessages.forEach((key) => {
            this.debugRenderingContext.fillText(this.logMessages.get(key), 10, y);
            y += 30;
        });
    }
    /** Renders the nodes registered with the debug canvas */
    static renderNodes() {
        if (this.nodes) {
            this.nodes.forEach(node => {
                node.debugRender();
            });
        }
    }
}
exports.default = Debug;
/** A map of log messages to display on the screen */
Debug.logMessages = new Map_1.default();
/** The rendering color for text */
Debug.defaultTextColor = Color_1.default.WHITE;
},{"../DataTypes/Collections/Map":5,"../DataTypes/Vec2":23,"../Utils/Color":104}],25:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Color_1 = __importDefault(require("../Utils/Color"));
// @ignorePage
class Stats extends Object {
    static initStats() {
        let canvas = document.getElementById("stats-canvas");
        canvas.width = this.CANVAS_WIDTH;
        canvas.height = this.CANVAS_HEIGHT;
        this.ctx = canvas.getContext("2d");
        this.statsDiv = document.getElementById("stats-display");
        this.prevfps = new Array();
        this.prevClearTimes = new Array();
        this.SGClearTimes = new Array();
        this.avgSGClearTime = 0;
        this.prevFillTimes = new Array();
        this.SGFillTimes = new Array();
        this.avgSGFillTime = 0;
        this.prevUpdateTimes = new Array();
        this.SGUpdateTimes = new Array();
        this.avgSGUpdateTime = 0;
        this.prevQueryTimes = new Array();
        this.SGQueryTimes = new Array();
        this.avgSGQueryTime = 0;
        let clearTime = document.createElement("span");
        clearTime.setAttribute("id", "sgclear");
        let fillTime = document.createElement("span");
        fillTime.setAttribute("id", "sgfill");
        let updateTime = document.createElement("span");
        updateTime.setAttribute("id", "sgupdate");
        let queryTime = document.createElement("span");
        queryTime.setAttribute("id", "sgquery");
        let br1 = document.createElement("br");
        let br2 = document.createElement("br");
        let br3 = document.createElement("br");
        this.statsDiv.append(clearTime, br1, fillTime, br2, updateTime, br3, queryTime);
        this.graphChoices = document.getElementById("chart-option");
        let option1 = document.createElement("option");
        option1.value = "prevfps";
        option1.label = "FPS";
        let option2 = document.createElement("option");
        option2.value = "prevClearTimes";
        option2.label = "Clear Time";
        let option3 = document.createElement("option");
        option3.value = "prevFillTimes";
        option3.label = "Fill time";
        let option4 = document.createElement("option");
        option4.value = "prevUpdateTimes";
        option4.label = "Update time";
        let option5 = document.createElement("option");
        option5.value = "prevQueryTimes";
        option5.label = "Query Time";
        let optionAll = document.createElement("option");
        optionAll.value = "all";
        optionAll.label = "All";
        this.graphChoices.append(option1, option2, option3, option4, option5, optionAll);
    }
    static updateFPS(fps) {
        this.prevfps.push(fps);
        if (this.prevfps.length > Stats.NUM_POINTS) {
            this.prevfps.shift();
        }
        if (this.SGClearTimes.length > 0) {
            this.prevClearTimes.push(this.avgSGClearTime);
            if (this.prevClearTimes.length > this.NUM_POINTS) {
                this.prevClearTimes.shift();
            }
        }
        if (this.SGFillTimes.length > 0) {
            this.prevFillTimes.push(this.avgSGFillTime);
            if (this.prevFillTimes.length > this.NUM_POINTS) {
                this.prevFillTimes.shift();
            }
        }
        if (this.SGUpdateTimes.length > 0) {
            this.prevUpdateTimes.push(this.avgSGUpdateTime);
            if (this.prevUpdateTimes.length > this.NUM_POINTS) {
                this.prevUpdateTimes.shift();
            }
        }
        if (this.SGQueryTimes.length > 0) {
            this.prevQueryTimes.push(this.avgSGQueryTime);
            if (this.prevQueryTimes.length > this.NUM_POINTS) {
                this.prevQueryTimes.shift();
            }
        }
        this.updateSGStats();
    }
    static log(key, data) {
        if (key === "sgclear") {
            this.SGClearTimes.push(data);
            if (this.SGClearTimes.length > 100) {
                this.SGClearTimes.shift();
            }
        }
        else if (key === "sgfill") {
            this.SGFillTimes.push(data);
            if (this.SGFillTimes.length > 100) {
                this.SGFillTimes.shift();
            }
        }
        else if (key === "sgupdate") {
            this.SGUpdateTimes.push(data);
            if (this.SGUpdateTimes.length > 100) {
                this.SGUpdateTimes.shift();
            }
        }
        else if (key === "sgquery") {
            this.SGQueryTimes.push(data);
            if (this.SGQueryTimes.length > 1000) {
                this.SGQueryTimes.shift();
            }
        }
    }
    static render() {
        // Display stats
        this.drawCharts();
    }
    static drawCharts() {
        this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
        let paramString = this.graphChoices.value;
        if (paramString === "prevfps" || paramString === "all") {
            let param = this.prevfps;
            let color = Color_1.default.BLUE.toString();
            this.drawChart(param, color);
        }
        if (paramString === "prevClearTimes" || paramString === "all") {
            let param = this.prevClearTimes;
            let color = Color_1.default.RED.toString();
            this.drawChart(param, color);
        }
        if (paramString === "prevFillTimes" || paramString === "all") {
            let param = this.prevFillTimes;
            let color = Color_1.default.GREEN.toString();
            this.drawChart(param, color);
        }
        if (paramString === "prevUpdateTimes" || paramString === "all") {
            let param = this.prevUpdateTimes;
            let color = Color_1.default.CYAN.toString();
            this.drawChart(param, color);
        }
        if (paramString === "prevQueryTimes" || paramString === "all") {
            let param = this.prevQueryTimes;
            let color = Color_1.default.ORANGE.toString();
            this.drawChart(param, color);
        }
    }
    static drawChart(param, color) {
        this.ctx.strokeStyle = Color_1.default.BLACK.toString();
        this.ctx.beginPath();
        this.ctx.moveTo(10, 10);
        this.ctx.lineTo(10, this.CANVAS_HEIGHT - 10);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(10, this.CANVAS_HEIGHT - 10);
        this.ctx.lineTo(this.CANVAS_WIDTH - 10, this.CANVAS_HEIGHT - 10);
        this.ctx.closePath();
        this.ctx.stroke();
        let max = Math.max(...param);
        let prevX = 10;
        let prevY = this.CANVAS_HEIGHT - 10 - param[0] / max * (this.CANVAS_HEIGHT - 20);
        this.ctx.strokeStyle = color;
        for (let i = 1; i < param.length; i++) {
            let fps = param[i];
            let x = 10 + i * (this.CANVAS_WIDTH - 20) / this.NUM_POINTS;
            let y = this.CANVAS_HEIGHT - 10 - fps / max * (this.CANVAS_HEIGHT - 20);
            this.ctx.beginPath();
            this.ctx.moveTo(prevX, prevY);
            this.ctx.lineTo(x, y);
            this.ctx.closePath();
            this.ctx.stroke();
            prevX = x;
            prevY = y;
        }
    }
    static updateSGStats() {
        if (this.SGClearTimes.length > 0) {
            this.avgSGClearTime = this.SGClearTimes.reduce((acc, val) => acc + val) / this.SGClearTimes.length;
        }
        if (this.SGFillTimes.length > 0) {
            this.avgSGFillTime = this.SGFillTimes.reduce((acc, val) => acc + val) / this.SGFillTimes.length;
        }
        if (this.SGUpdateTimes.length > 0) {
            this.avgSGUpdateTime = this.SGUpdateTimes.reduce((acc, val) => acc + val) / this.SGUpdateTimes.length;
        }
        if (this.SGQueryTimes.length > 0) {
            this.avgSGQueryTime = this.SGQueryTimes.reduce((acc, val) => acc + val) / this.SGQueryTimes.length;
        }
        document.getElementById("sgclear").innerHTML = "Avg SG clear time: " + this.avgSGClearTime;
        document.getElementById("sgfill").innerHTML = "Avg SG fill time: " + this.avgSGFillTime;
        document.getElementById("sgupdate").innerHTML = "Avg SG update time: " + this.avgSGUpdateTime;
        document.getElementById("sgquery").innerHTML = "Avg SG query time: " + this.avgSGQueryTime;
    }
}
exports.default = Stats;
Stats.NUM_POINTS = 60;
Stats.CANVAS_WIDTH = 300;
Stats.CANVAS_HEIGHT = 300;
},{"../Utils/Color":104}],26:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventQueue_1 = __importDefault(require("./EventQueue"));
const GameEvent_1 = __importDefault(require("./GameEvent"));
/**
 * An event emitter object other systems can use to hook into the EventQueue.
 * Provides an easy interface for firing off events.
 */
class Emitter {
    /** Creates a new Emitter */
    constructor() {
        this.eventQueue = EventQueue_1.default.getInstance();
    }
    /**
     * Emit and event of type eventType with the data packet data
     * @param eventType The name of the event to fire off
     * @param data A @reference[Map] or record containing any data about the event
     */
    fireEvent(eventType, data = null) {
        this.eventQueue.addEvent(new GameEvent_1.default(eventType, data));
    }
}
exports.default = Emitter;
},{"./EventQueue":27,"./GameEvent":28}],27:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("../DataTypes/Collections/Queue"));
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const GameEventType_1 = require("./GameEventType");
/**
 * The main event system of the game engine.
 * Events are sent to the EventQueue, which handles distribution to any systems that are listening for those events.
 * This allows for handling of input without having classes directly hook into javascript event handles,
 * and allows otherwise separate classes to communicate with each other cleanly, such as a Player object
 * requesting a sound be played by the audio system.
 *
 * The distribution of @reference[GameEvent]s happens as follows:
 *
 * Events are recieved throughout a frame and are queued up by the EventQueue.
 * At the beginning of the next frame, events are sent out to any receivers that are hooked into the event type.
 * @reference[Receiver]s are then free to process events as they see fit.
 *
 * Overall, the EventQueue can be considered as something similar to an email server,
 * and the @reference[Receiver]s can be considered as the client inboxes.
 *
 * See @link(Game Programming Patterns)(https://gameprogrammingpatterns.com/event-queue.html) for more discussion on EventQueues
 */
class EventQueue {
    constructor() {
        this.MAX_SIZE = 200;
        this.q = new Queue_1.default(this.MAX_SIZE);
        this.receivers = new Map_1.default();
    }
    /** Retrieves the instance of the Singleton EventQueue */
    static getInstance() {
        if (this.instance === null) {
            this.instance = new EventQueue();
        }
        return this.instance;
    }
    /** Adds an event to the EventQueue.
     * This is exposed to the rest of the game engine through the @reference[Emitter] class */
    addEvent(event) {
        this.q.enqueue(event);
    }
    /**
     * Associates a receiver with a type of event. Every time this event appears in the future,
     * it will be given to the receiver (and any others watching that type).
     * This is exposed to the rest of the game engine through the @reference[Receiver] class
     * @param receiver The event receiver
     * @param type The type or types of events to subscribe to
     */
    subscribe(receiver, type) {
        if (type instanceof Array) {
            // If it is an array, subscribe to all event types
            for (let t of type) {
                this.addListener(receiver, t);
            }
        }
        else {
            this.addListener(receiver, type);
        }
    }
    /**
     * Unsubscribes the specified receiver from all events, or from whatever events are provided
     * @param receiver The receiver to unsubscribe
     * @param keys The events to unsubscribe from. If none are provided, unsubscribe from all
     */
    unsubscribe(receiver, ...events) {
        this.receivers.forEach(eventName => {
            // If keys were provided, only continue if this key is one of them
            if (events.length > 0 && events.indexOf(eventName) === -1)
                return;
            // Find the index of our receiver for this key
            let index = this.receivers.get(eventName).indexOf(receiver);
            // If an index was found, remove the receiver
            if (index !== -1) {
                this.receivers.get(eventName).splice(index, 1);
            }
        });
    }
    // Associate the receiver and the type
    addListener(receiver, type) {
        if (this.receivers.has(type)) {
            this.receivers.get(type).push(receiver);
        }
        else {
            this.receivers.add(type, [receiver]);
        }
    }
    update(deltaT) {
        while (this.q.hasItems()) {
            // Retrieve each event
            let event = this.q.dequeue();
            // If a receiver has this event type, send it the event
            if (this.receivers.has(event.type)) {
                for (let receiver of this.receivers.get(event.type)) {
                    receiver.receive(event);
                }
            }
            // If a receiver is subscribed to all events, send it the event
            if (this.receivers.has(GameEventType_1.GameEventType.ALL)) {
                for (let receiver of this.receivers.get(GameEventType_1.GameEventType.ALL)) {
                    receiver.receive(event);
                }
            }
        }
    }
}
exports.default = EventQueue;
EventQueue.instance = null;
},{"../DataTypes/Collections/Map":5,"../DataTypes/Collections/Queue":6,"./GameEventType":29}],28:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
/**
 * A representation of an in-game event that is passed through the @reference[EventQueue]
 */
class GameEvent {
    /**
     * Creates a new GameEvent.
     * This is handled implicitly through the @reference[Emitter] class
     * @param type The type of the GameEvent
     * @param data The data contained by the GameEvent
     */
    constructor(type, data = null) {
        // Parse the game event data
        if (data === null) {
            this.data = new Map_1.default();
        }
        else if (!(data instanceof Map_1.default)) {
            // data is a raw object, unpack
            this.data = new Map_1.default();
            for (let key in data) {
                this.data.add(key, data[key]);
            }
        }
        else {
            this.data = data;
        }
        this.type = type;
        this.time = Date.now();
    }
    /**
     * Checks the type of the GameEvent
     * @param type The type to check
     * @returns True if the GameEvent is the specified type, false otherwise.
     */
    isType(type) {
        return this.type === type;
    }
    /**
     * Returns this GameEvent as a string
     * @returns The string representation of the GameEvent
     */
    toString() {
        return this.type + ": @" + this.time;
    }
}
exports.default = GameEvent;
},{"../DataTypes/Collections/Map":5}],29:[function(require,module,exports){
"use strict";
// @ignorePage
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEventType = void 0;
var GameEventType;
(function (GameEventType) {
    /**
     * Mouse Down event. Has data: {position: Vec2 - Mouse Position}
     */
    GameEventType["MOUSE_DOWN"] = "mouse_down";
    /**
     * Mouse Up event. Has data: {position: Vec2 - Mouse Position}
     */
    GameEventType["MOUSE_UP"] = "mouse_up";
    /**
     * Mouse Move event. Has data: {position: Vec2 - Mouse Position}
     */
    GameEventType["MOUSE_MOVE"] = "mouse_move";
    /**
     * Key Down event. Has data: {key: string - The key that is down}
     */
    GameEventType["KEY_DOWN"] = "key_down";
    /**
     * Key Up event. Has data: {key: string - The key that is up}
     */
    GameEventType["KEY_UP"] = "key_up";
    /**
     * Canvas Blur event. Has data: {}
     */
    GameEventType["CANVAS_BLUR"] = "canvas_blur";
    /**
     * Mouse wheel up event. Has data: {}
     */
    GameEventType["WHEEL_UP"] = "wheel_up";
    /**
     * Mouse wheel down event. Has data: {}
     */
    GameEventType["WHEEL_DOWN"] = "wheel_down";
    /**
     * Start Recording event. Has data: {recording: AbstractRecording}
     */
    GameEventType["START_RECORDING"] = "start_recording";
    /**
     * Stop Recording event. Has data: {}
     */
    GameEventType["STOP_RECORDING"] = "stop_recording";
    /**
     * Play Recording event. Has data: {}
     */
    GameEventType["PLAY_RECORDING"] = "play_recording";
    /**
     * Play Sound event. Has data: {key: string, loop: boolean, holdReference: boolean }
     */
    GameEventType["PLAY_SOUND"] = "play_sound";
    /**
     * Play Sound event. Has data: {key: string}
     */
    GameEventType["STOP_SOUND"] = "stop_sound";
    /**
     * Play Sound event. Has data: {key: string, loop: boolean, holdReference: boolean, channel: AudioChannelType }
     */
    GameEventType["PLAY_SFX"] = "play_sfx";
    /**
     * Play Sound event. Has data: {key: string, loop: boolean, holdReference: boolean }
     */
    GameEventType["PLAY_MUSIC"] = "play_music";
    /**
     * Mute audio channel event. Has data: {channel: AudioChannelType}
     */
    GameEventType["MUTE_CHANNEL"] = "mute_channel";
    /**
     * Unmute audio channel event. Has data: {channel: AudioChannelType}
     */
    GameEventType["UNMUTE_CHANNEL"] = "unmute_channel";
    /**
     * Encompasses all event types. Used for receivers only.
     */
    GameEventType["ALL"] = "all";
    /**
     * Disables reveiving input from the user for the specified inputs. Has data: {inputs: InputHanlders[]}
     */
    GameEventType["DISABLE_USER_INPUT"] = "disable_user_input";
    /**
     * Enables receiving input from the user for the specified inputs. Has data: {inputs: InputHandlers[]}
     */
    GameEventType["ENABLE_USER_INPUT"] = "enable_user_input";
    /**
     * Triggers a scene change. Has data: {scene: new (...args: any) => T extends Scene, init: Record<string, any>}
     */
    GameEventType["CHANGE_SCENE"] = "change_scene";
})(GameEventType = exports.GameEventType || (exports.GameEventType = {}));
},{}],30:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Queue_1 = __importDefault(require("../DataTypes/Collections/Queue"));
const EventQueue_1 = __importDefault(require("./EventQueue"));
/**
 * Receives subscribed events from the EventQueue.
 */
class Receiver {
    /** Creates a new Receiver */
    constructor() {
        this.MAX_SIZE = 200;
        this.q = new Queue_1.default(this.MAX_SIZE);
    }
    destroy() {
        EventQueue_1.default.getInstance().unsubscribe(this);
    }
    /**
     * Adds these types of events to this receiver's queue every update.
     * @param eventTypes The types of events this receiver will be subscribed to
     */
    subscribe(eventTypes) {
        EventQueue_1.default.getInstance().subscribe(this, eventTypes);
        this.q.clear();
    }
    /**
     * Adds an event to the queue of this reciever. This is used by the @reference[EventQueue] to distribute events
     * @param event The event to receive
     */
    receive(event) {
        try {
            this.q.enqueue(event);
        }
        catch (e) {
            console.warn("Receiver overflow for event " + event.toString());
            throw e;
        }
    }
    /**
     * Retrieves the next event from the receiver's queue
     * @returns The next GameEvent
     */
    getNextEvent() {
        return this.q.dequeue();
    }
    /**
     * Looks at the next event in the receiver's queue, but doesn't remove it from the queue
     * @returns The next GameEvent
     */
    peekNextEvent() {
        return this.q.peekNext();
    }
    /**
     * Returns true if the receiver has any events in its queue
     * @returns True if the receiver has another event, false otherwise
     */
    hasNextEvent() {
        return this.q.hasItems();
    }
    /**
     * Ignore all events this frame
     */
    ignoreEvents() {
        this.q.clear();
    }
}
exports.default = Receiver;
},{"../DataTypes/Collections/Queue":6,"./EventQueue":27}],31:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const EventQueue_1 = __importDefault(require("../Events/EventQueue"));
const GameEventType_1 = require("../Events/GameEventType");
/**
 * Receives input events from the @reference[EventQueue] and allows for easy access of information about input by other systems
 */
class Input {
    /**
     * Initializes the Input object
     * @param viewport A reference to the viewport of the game
     */
    static initialize(viewport, keyMap) {
        Input.viewport = viewport;
        Input.mousePressed = false;
        Input.mouseJustPressed = false;
        Input.receiver = new Receiver_1.default();
        Input.keyJustPressed = new Map_1.default();
        Input.keyPressed = new Map_1.default();
        Input.mousePosition = new Vec2_1.default(0, 0);
        Input.mousePressPosition = new Vec2_1.default(0, 0);
        Input.scrollDirection = 0;
        Input.justScrolled = false;
        Input.keysDisabled = false;
        Input.mouseDisabled = false;
        // Initialize the keymap
        Input.keyMap = new Map_1.default();
        // Add all keys to the keymap
        for (let entry in keyMap) {
            let name = keyMap[entry].name;
            let keys = keyMap[entry].keys;
            Input.keyMap.add(name, keys);
        }
        Input.eventQueue = EventQueue_1.default.getInstance();
        // Subscribe to all input events
        Input.eventQueue.subscribe(Input.receiver, [GameEventType_1.GameEventType.MOUSE_DOWN, GameEventType_1.GameEventType.MOUSE_UP, GameEventType_1.GameEventType.MOUSE_MOVE,
            GameEventType_1.GameEventType.KEY_DOWN, GameEventType_1.GameEventType.KEY_UP, GameEventType_1.GameEventType.CANVAS_BLUR, GameEventType_1.GameEventType.WHEEL_UP, GameEventType_1.GameEventType.WHEEL_DOWN]);
    }
    static update(deltaT) {
        // Reset the justPressed values to false
        Input.mouseJustPressed = false;
        Input.keyJustPressed.forEach((key) => Input.keyJustPressed.set(key, false));
        Input.justScrolled = false;
        Input.scrollDirection = 0;
        while (Input.receiver.hasNextEvent()) {
            let event = Input.receiver.getNextEvent();
            // Handle each event type
            if (event.type === GameEventType_1.GameEventType.MOUSE_DOWN) {
                Input.mouseJustPressed = true;
                Input.mousePressed = true;
                Input.mousePressPosition = event.data.get("position");
                Input.mouseButtonPressed = event.data.get("button");
            }
            if (event.type === GameEventType_1.GameEventType.MOUSE_UP) {
                Input.mousePressed = false;
            }
            if (event.type === GameEventType_1.GameEventType.MOUSE_MOVE) {
                Input.mousePosition = event.data.get("position");
            }
            if (event.type === GameEventType_1.GameEventType.KEY_DOWN) {
                let key = event.data.get("key");
                // Handle space bar
                if (key === " ") {
                    key = "space";
                }
                if (!Input.keyPressed.get(key)) {
                    Input.keyJustPressed.set(key, true);
                    Input.keyPressed.set(key, true);
                }
            }
            if (event.type === GameEventType_1.GameEventType.KEY_UP) {
                let key = event.data.get("key");
                // Handle space bar
                if (key === " ") {
                    key = "space";
                }
                Input.keyPressed.set(key, false);
            }
            if (event.type === GameEventType_1.GameEventType.CANVAS_BLUR) {
                Input.clearKeyPresses();
            }
            if (event.type === GameEventType_1.GameEventType.WHEEL_UP) {
                Input.scrollDirection = -1;
                Input.justScrolled = true;
            }
            else if (event.type === GameEventType_1.GameEventType.WHEEL_DOWN) {
                Input.scrollDirection = 1;
                Input.justScrolled = true;
            }
        }
    }
    static clearKeyPresses() {
        Input.keyJustPressed.forEach((key) => Input.keyJustPressed.set(key, false));
        Input.keyPressed.forEach((key) => Input.keyPressed.set(key, false));
    }
    /**
     * Returns whether or not a key was newly pressed Input frame.
     * If the key is still pressed from last frame and wasn't re-pressed, Input will return false.
     * @param key The key
     * @returns True if the key was just pressed, false otherwise
     */
    static isKeyJustPressed(key) {
        if (Input.keysDisabled)
            return false;
        if (Input.keyJustPressed.has(key)) {
            return Input.keyJustPressed.get(key);
        }
        else {
            return false;
        }
    }
    /**
     * Returns an array of all of the keys that are newly pressed Input frame.
     * If a key is still pressed from last frame and wasn't re-pressed, it will not be in Input list.
     * @returns An array of all of the newly pressed keys.
     */
    static getKeysJustPressed() {
        if (Input.keysDisabled)
            return [];
        let keys = Array();
        Input.keyJustPressed.forEach(key => {
            if (Input.keyJustPressed.get(key)) {
                keys.push(key);
            }
        });
        return keys;
    }
    /**
     * Returns whether or not a key is being pressed.
     * @param key The key
     * @returns True if the key is currently pressed, false otherwise
     */
    static isKeyPressed(key) {
        if (Input.keysDisabled)
            return false;
        if (Input.keyPressed.has(key)) {
            return Input.keyPressed.get(key);
        }
        else {
            return false;
        }
    }
    /**
     * Changes the binding of an input name to keys
     * @param inputName The name of the input
     * @param keys The corresponding keys
     */
    static changeKeyBinding(inputName, keys) {
        Input.keyMap.set(inputName, keys);
    }
    /**
     * Clears all key bindings
     */
    static clearAllKeyBindings() {
        Input.keyMap.clear();
    }
    /**
     * Returns whether or not an input was just pressed this frame
     * @param inputName The name of the input
     * @returns True if the input was just pressed, false otherwise
     */
    static isJustPressed(inputName) {
        if (Input.keysDisabled)
            return false;
        if (Input.keyMap.has(inputName)) {
            const keys = Input.keyMap.get(inputName);
            let justPressed = false;
            for (let key of keys) {
                justPressed = justPressed || Input.isKeyJustPressed(key);
            }
            return justPressed;
        }
        else {
            return false;
        }
    }
    /**
     * Returns whether or not an input is currently pressed
     * @param inputName The name of the input
     * @returns True if the input is pressed, false otherwise
     */
    static isPressed(inputName) {
        if (Input.keysDisabled)
            return false;
        if (Input.keyMap.has(inputName)) {
            const keys = Input.keyMap.get(inputName);
            let pressed = false;
            for (let key of keys) {
                pressed = pressed || Input.isKeyPressed(key);
            }
            return pressed;
        }
        else {
            return false;
        }
    }
    /**
     *
     * Returns whether or not the mouse was newly pressed Input frame.
     * @param mouseButton Optionally specify which mouse click you want to know was pressed.
     * 0 for left click, 1 for middle click, 2 for right click.
     * @returns True if the mouse was just pressed, false otherwise
     */
    static isMouseJustPressed(mouseButton) {
        if (mouseButton !== undefined) {
            return Input.mouseJustPressed && !Input.mouseDisabled && mouseButton == this.mouseButtonPressed;
        }
        return Input.mouseJustPressed && !Input.mouseDisabled;
    }
    /**
     * Returns whether or not the mouse is currently pressed
     * @param mouseButton Optionally specify which mouse click you want to know was pressed.
     * 0 for left click, 1 for middle click, 2 for right click.
     * @returns True if the mouse is currently pressed, false otherwise
     */
    static isMousePressed(mouseButton) {
        if (mouseButton !== undefined) {
            return Input.mousePressed && !Input.mouseDisabled && mouseButton == this.mouseButtonPressed;
        }
        return Input.mousePressed && !Input.mouseDisabled;
    }
    /**
     * Returns whether the user scrolled or not
     * @returns True if the user just scrolled Input frame, false otherwise
     */
    static didJustScroll() {
        return Input.justScrolled && !Input.mouseDisabled;
    }
    /**
     * Gets the direction of the scroll
     * @returns -1 if the user scrolled up, 1 if they scrolled down
     */
    static getScrollDirection() {
        return Input.scrollDirection;
    }
    /**
     * Gets the position of the player's mouse
     * @returns The mouse position stored as a Vec2
     */
    static getMousePosition() {
        return Input.mousePosition.scaled(1 / this.viewport.getZoomLevel());
    }
    /**
     * Gets the position of the player's mouse in the game world,
     * taking into consideration the scrolling of the viewport
     * @returns The mouse position stored as a Vec2
     */
    static getGlobalMousePosition() {
        return Input.mousePosition.clone().scale(1 / this.viewport.getZoomLevel()).add(Input.viewport.getOrigin());
    }
    /**
     * Gets the position of the last mouse press
     * @returns The mouse position stored as a Vec2
     */
    static getMousePressPosition() {
        return Input.getMousePosition();
    }
    /**
     * Gets the position of the last mouse press in the game world,
     * taking into consideration the scrolling of the viewport
     * @returns The mouse position stored as a Vec2
     */
    static getGlobalMousePressPosition() {
        return Input.mousePressPosition.clone().add(Input.viewport.getOrigin());
    }
    /**
     * Disables all keypress and mouse click inputs
     */
    static disableInput() {
        Input.keysDisabled = true;
        Input.mouseDisabled = true;
    }
    /**
     * Enables all keypress and mouse click inputs
     */
    static enableInput() {
        Input.keysDisabled = false;
        Input.mouseDisabled = false;
    }
}
exports.default = Input;
},{"../DataTypes/Collections/Map":5,"../DataTypes/Vec2":23,"../Events/EventQueue":27,"../Events/GameEventType":29,"../Events/Receiver":30}],32:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputHandlers = void 0;
const EventQueue_1 = __importDefault(require("../Events/EventQueue"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const GameEvent_1 = __importDefault(require("../Events/GameEvent"));
const GameEventType_1 = require("../Events/GameEventType");
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const Events_1 = require("../../hw4/Events");
var InputHandlers;
(function (InputHandlers) {
    InputHandlers[InputHandlers["MOUSE_DOWN"] = 0] = "MOUSE_DOWN";
    InputHandlers[InputHandlers["MOUSE_UP"] = 1] = "MOUSE_UP";
    InputHandlers[InputHandlers["CONTEXT_MENU"] = 2] = "CONTEXT_MENU";
    InputHandlers[InputHandlers["MOUSE_MOVE"] = 3] = "MOUSE_MOVE";
    InputHandlers[InputHandlers["KEY_DOWN"] = 4] = "KEY_DOWN";
    InputHandlers[InputHandlers["KEY_UP"] = 5] = "KEY_UP";
    InputHandlers[InputHandlers["ON_BLUR"] = 6] = "ON_BLUR";
    InputHandlers[InputHandlers["ON_WHEEL"] = 7] = "ON_WHEEL";
})(InputHandlers = exports.InputHandlers || (exports.InputHandlers = {}));
/**
 * Handles communication with the web browser to receive asynchronous events and send them to the @reference[EventQueue]
 */
class InputHandler {
    /**
     * Creates a new InputHandler
     * @param canvas The game canvas
     */
    constructor(canvas) {
        this.handleMouseDown = (event, canvas) => {
            if (!this.enabled[InputHandlers.MOUSE_DOWN])
                return;
            let pos = this.getMousePosition(event, canvas);
            let button = event.button;
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.MOUSE_DOWN, { position: pos, button: button });
            this.eventQueue.addEvent(gameEvent);
        };
        this.handleMouseUp = (event, canvas) => {
            if (!this.enabled[InputHandlers.MOUSE_DOWN])
                return;
            let pos = this.getMousePosition(event, canvas);
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.MOUSE_UP, { position: pos });
            this.eventQueue.addEvent(gameEvent);
        };
        this.handleMouseMove = (event, canvas) => {
            if (!this.enabled[InputHandlers.MOUSE_MOVE])
                return;
            let pos = this.getMousePosition(event, canvas);
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.MOUSE_MOVE, { position: pos });
            this.eventQueue.addEvent(gameEvent);
        };
        this.handleKeyDown = (event) => {
            if (!this.enabled[InputHandlers.KEY_DOWN])
                return;
            let key = this.getKey(event);
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.KEY_DOWN, { key: key });
            this.eventQueue.addEvent(gameEvent);
            if (key === 'escape') {
                let pauseEvent = new GameEvent_1.default(Events_1.InputEvent.PAUSED, {});
                this.eventQueue.addEvent(pauseEvent);
            }
            if (key === '0') {
                let unlockAllLevels = new GameEvent_1.default(Events_1.CheatEvent.UNLOCK_ALL_LEVELS, {});
                this.eventQueue.addEvent(unlockAllLevels);
            }
            if (key === '9') {
                let infiniteHealth = new GameEvent_1.default(Events_1.CheatEvent.INFINITE_HEALTH, {});
                this.eventQueue.addEvent(infiniteHealth);
            }
            if (key === '8') {
                let endDay = new GameEvent_1.default(Events_1.CheatEvent.END_DAY, {});
                this.eventQueue.addEvent(endDay);
            }
        };
        this.handleKeyUp = (event) => {
            if (!this.enabled[InputHandlers.KEY_UP])
                return;
            let key = this.getKey(event);
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.KEY_UP, { key: key });
            this.eventQueue.addEvent(gameEvent);
        };
        this.handleBlur = (event) => {
            if (!this.enabled[InputHandlers.ON_BLUR])
                return;
            let gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.CANVAS_BLUR, {});
            this.eventQueue.addEvent(gameEvent);
        };
        this.handleContextMenu = (event) => {
            event.preventDefault();
            event.stopPropagation();
        };
        this.handleWheel = (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!this.enabled[InputHandlers.ON_WHEEL])
                return;
            let gameEvent;
            if (event.deltaY < 0) {
                gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.WHEEL_UP, {});
            }
            else {
                gameEvent = new GameEvent_1.default(GameEventType_1.GameEventType.WHEEL_DOWN, {});
            }
            this.eventQueue.addEvent(gameEvent);
        };
        this.eventQueue = EventQueue_1.default.getInstance();
        this.enabled = new Array(...[true, true, true, true, true, true, true, true]);
        canvas.onmousedown = (event) => this.handleMouseDown(event, canvas);
        canvas.onmouseup = (event) => this.handleMouseUp(event, canvas);
        canvas.oncontextmenu = this.handleContextMenu;
        canvas.onmousemove = (event) => this.handleMouseMove(event, canvas);
        document.onkeydown = this.handleKeyDown;
        document.onkeyup = this.handleKeyUp;
        document.onblur = this.handleBlur;
        document.oncontextmenu = this.handleBlur;
        document.onwheel = this.handleWheel;
        this.receiver = new Receiver_1.default();
        this.receiver.subscribe(GameEventType_1.GameEventType.DISABLE_USER_INPUT);
        this.receiver.subscribe(GameEventType_1.GameEventType.ENABLE_USER_INPUT);
    }
    update(deltaT) {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case GameEventType_1.GameEventType.DISABLE_USER_INPUT: {
                this.disableHandlers(event.data.get("inputs"));
                break;
            }
            case GameEventType_1.GameEventType.ENABLE_USER_INPUT: {
                this.enableHandlers(event.data.get("inputs"));
                break;
            }
            default: {
                throw new Error(`Unhandled event with type: ${event.type} caught in InputHandler.ts`);
            }
        }
    }
    enableHandlers(handlers) {
        handlers.forEach(handler => this.enabled[handler] = true);
    }
    disableHandlers(handlers) {
        handlers.forEach(handler => this.enabled[handler] = false);
    }
    getKey(keyEvent) {
        return keyEvent.key.toLowerCase();
    }
    getMousePosition(mouseEvent, canvas) {
        let rect = canvas.getBoundingClientRect();
        let x = mouseEvent.clientX - rect.left;
        let y = mouseEvent.clientY - rect.top;
        return new Vec2_1.default(x, y);
    }
}
exports.default = InputHandler;
},{"../../hw4/Events":124,"../DataTypes/Vec2":23,"../Events/EventQueue":27,"../Events/GameEvent":28,"../Events/GameEventType":29,"../Events/Receiver":30}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ignorePage
/**
 * Sets up the environment of the game engine
 */
class EnvironmentInitializer {
    static setup() {
        CanvasRenderingContext2D.prototype.roundedRect = function (x, y, w, h, r) {
            // Clamp the radius between 0 and the min of the width or height
            if (r < 0)
                r = 0;
            if (r > Math.min(w, h))
                r = Math.min(w, h);
            // Draw the rounded rect
            this.beginPath();
            // Top
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.arcTo(x + w, y, x + w, y + r, r);
            // Right
            this.lineTo(x + w, y + h - r);
            this.arcTo(x + w, y + h, x + w - r, y + h, r);
            // Bottom
            this.lineTo(x + r, y + h);
            this.arcTo(x, y + h, x, y + h - r, r);
            // Left
            this.lineTo(x, y + r);
            this.arcTo(x, y, x + r, y, r);
            this.closePath();
        };
        CanvasRenderingContext2D.prototype.strokeRoundedRect = function (x, y, w, h, r) {
            this.roundedRect(x, y, w, h, r);
            this.stroke();
        };
        CanvasRenderingContext2D.prototype.fillRoundedRect = function (x, y, w, h, r) {
            this.roundedRect(x, y, w, h, r);
            this.fill();
        };
    }
}
exports.default = EnvironmentInitializer;
},{}],34:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameLoop_1 = __importDefault(require("./GameLoop"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
const Stats_1 = __importDefault(require("../Debug/Stats"));
/**
 * A game loop with a fixed update time and a variable render time.
 * Every frame, the game updates until all time since the last frame has been processed.
 * If too much time has passed, such as if the last update was too slow,
 * or if the browser was put into the background, the loop will panic and discard time.
 * A render happens at the end of every frame. This happens as fast as possible unless specified.
 * A loop of this type allows for deterministic behavior - No matter what the frame rate is, the update should behave the same,
 * as it is occuring in a fixed interval.
 */
class FixedUpdateGameLoop extends GameLoop_1.default {
    constructor() {
        super();
        /**
         * The main loop of the game. Updates until the current time is reached. Renders once
         * @param timestamp The current time in ms
         */
        this.doFrame = (timestamp) => {
            // If a pause was executed, stop doing the loop.
            if (this.paused) {
                return;
            }
            // Request animation frame to prepare for another update or render
            window.requestAnimationFrame((t) => this.doFrame(t));
            // If we are trying to render too soon, do nothing.
            if (timestamp < this.lastFrameTime + this.minFrameDelay) {
                return;
            }
            // A frame is actually happening
            this.startFrame(timestamp);
            // Update while there is still time to make up. If we do too many update steps, panic and exit the loop.
            this.numUpdateSteps = 0;
            let panic = false;
            while (this.frameDelta >= this.updateTimestep) {
                // Do an update
                this._doUpdate(this.updateTimestep / 1000);
                // Remove the update step time from the time we have to process
                this.frameDelta -= this.updateTimestep;
                // Increment steps and check if we've done too many
                this.numUpdateSteps++;
                if (this.numUpdateSteps > 100) {
                    panic = true;
                    break;
                }
            }
            // Updates are done, render
            this._doRender();
            // Wrap up the frame
            this.finishFrame(panic);
        };
        this.maxUpdateFPS = 60;
        this.updateTimestep = Math.floor(1000 / this.maxUpdateFPS);
        this.frameDelta = 0;
        this.lastFrameTime = 0;
        this.minFrameDelay = 0;
        this.frame = 0;
        this.fps = this.maxUpdateFPS; // Initialize the fps to the max allowed fps
        this.fpsUpdateInterval = 1000;
        this.lastFpsUpdate = 0;
        this.framesSinceLastFpsUpdate = 0;
        this.started = false;
        this.paused = false;
        this.running = false;
        this.numUpdateSteps = 0;
    }
    getFPS() {
        return 0;
    }
    /**
     * Updates the frame count and sum of time for the framerate of the game
     * @param timestep The current time in ms
     */
    updateFPS(timestamp) {
        this.fps = 0.9 * this.framesSinceLastFpsUpdate * 1000 / (timestamp - this.lastFpsUpdate) + (1 - 0.9) * this.fps;
        this.lastFpsUpdate = timestamp;
        this.framesSinceLastFpsUpdate = 0;
        Debug_1.default.log("fps", "FPS: " + this.fps.toFixed(1));
        Stats_1.default.updateFPS(this.fps);
    }
    /**
 * Changes the maximum allowed physics framerate of the game
 * @param initMax The max framerate
 */
    setMaxUpdateFPS(initMax) {
        this.maxUpdateFPS = initMax;
        this.updateTimestep = Math.floor(1000 / this.maxUpdateFPS);
    }
    /**
     * Sets the maximum rendering framerate
     * @param maxFPS The max framerate
     */
    setMaxFPS(maxFPS) {
        this.minFrameDelay = 1000 / maxFPS;
    }
    /**
     * This function is called when the game loop panics, i.e. it tries to process too much time in an entire frame.
     * This will reset the amount of time back to zero.
     * @returns The amount of time we are discarding from processing.
     */
    resetFrameDelta() {
        let oldFrameDelta = this.frameDelta;
        this.frameDelta = 0;
        return oldFrameDelta;
    }
    /**
     * Starts up the game loop and calls the first requestAnimationFrame
     */
    start() {
        if (!this.started) {
            this.started = true;
            window.requestAnimationFrame((timestamp) => this.doFirstFrame(timestamp));
        }
    }
    pause() {
        this.paused = true;
    }
    resume() {
        this.paused = false;
    }
    /**
     * The first game frame - initializes the first frame time and begins the render
     * @param timestamp The current time in ms
     */
    doFirstFrame(timestamp) {
        this.running = true;
        this._doRender();
        this.lastFrameTime = timestamp;
        this.lastFpsUpdate = timestamp;
        this.framesSinceLastFpsUpdate = 0;
        window.requestAnimationFrame((t) => this.doFrame(t));
    }
    /**
     * Handles any processing that needs to be done at the start of the frame
     * @param timestamp The time of the frame in ms
     */
    startFrame(timestamp) {
        // Update the amount of time we need our update to process
        this.frameDelta += timestamp - this.lastFrameTime;
        // Set the new time of the last frame
        this.lastFrameTime = timestamp;
        // Update the estimate of the framerate
        if (timestamp > this.lastFpsUpdate + this.fpsUpdateInterval) {
            this.updateFPS(timestamp);
        }
        // Increment the number of frames
        this.frame++;
        this.framesSinceLastFpsUpdate++;
    }
    /**
     * Wraps up the frame and handles the panic state if there is one
     * @param panic Whether or not the loop panicked
     */
    finishFrame(panic) {
        if (panic) {
            var discardedTime = Math.round(this.resetFrameDelta());
            console.warn('Main loop panicked, probably because the browser tab was put in the background. Discarding ' + discardedTime + 'ms');
        }
    }
}
exports.default = FixedUpdateGameLoop;
},{"../Debug/Debug":24,"../Debug/Stats":25,"./GameLoop":36}],35:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventQueue_1 = __importDefault(require("../Events/EventQueue"));
const Input_1 = __importDefault(require("../Input/Input"));
const InputHandler_1 = __importDefault(require("../Input/InputHandler"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
const Viewport_1 = __importDefault(require("../SceneGraph/Viewport"));
const SceneManager_1 = __importDefault(require("../Scene/SceneManager"));
const AudioManager_1 = __importDefault(require("../Sound/AudioManager"));
const Stats_1 = __importDefault(require("../Debug/Stats"));
const CanvasRenderer_1 = __importDefault(require("../Rendering/CanvasRenderer"));
const Color_1 = __importDefault(require("../Utils/Color"));
const GameOptions_1 = __importDefault(require("./GameOptions"));
const FixedUpdateGameLoop_1 = __importDefault(require("./FixedUpdateGameLoop"));
const EnvironmentInitializer_1 = __importDefault(require("./EnvironmentInitializer"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const RegistryManager_1 = __importDefault(require("../Registry/RegistryManager"));
const WebGLRenderer_1 = __importDefault(require("../Rendering/WebGLRenderer"));
const PlaybackManager_1 = __importDefault(require("../Playback/PlaybackManager"));
/**
 * The main loop of the game engine.
 * Handles the update order, and initializes all subsystems.
 * The Game manages the update cycle, and requests animation frames to render to the browser.
 */
class Game {
    /**
     * Creates a new Game
     * @param options The options for Game initialization
     */
    constructor(options) {
        // Before anything else, build the environment
        EnvironmentInitializer_1.default.setup();
        // Typecast the config object to a GameConfig object
        this.gameOptions = GameOptions_1.default.parse(options);
        this.showDebug = this.gameOptions.showDebug;
        this.showStats = this.gameOptions.showStats;
        // Create an instance of a game loop
        this.loop = new FixedUpdateGameLoop_1.default();
        // Get the game canvas and give it a background color
        this.GAME_CANVAS = document.getElementById("game-canvas");
        this.DEBUG_CANVAS = document.getElementById("debug-canvas");
        // Give the canvas a size and get the rendering context
        this.WIDTH = this.gameOptions.canvasSize.x;
        this.HEIGHT = this.gameOptions.canvasSize.y;
        // This step MUST happen before the resource manager does anything
        if (this.gameOptions.useWebGL) {
            this.renderingManager = new WebGLRenderer_1.default();
        }
        else {
            this.renderingManager = new CanvasRenderer_1.default();
        }
        this.initializeGameWindow();
        this.ctx = this.renderingManager.initializeCanvas(this.GAME_CANVAS, this.WIDTH, this.HEIGHT);
        this.clearColor = new Color_1.default(this.gameOptions.clearColor.r, this.gameOptions.clearColor.g, this.gameOptions.clearColor.b);
        // Initialize debugging and stats
        Debug_1.default.initializeDebugCanvas(this.DEBUG_CANVAS, this.WIDTH, this.HEIGHT);
        Stats_1.default.initStats();
        if (this.gameOptions.showStats) {
            // Find the stats output and make it no longer hidden
            document.getElementById("stats").hidden = false;
        }
        // Size the viewport to the game canvas
        const canvasSize = new Vec2_1.default(this.WIDTH, this.HEIGHT);
        this.viewport = new Viewport_1.default(canvasSize, this.gameOptions.zoomLevel);
        // Initialize all necessary game subsystems
        this.eventQueue = EventQueue_1.default.getInstance();
        this.inputHandler = new InputHandler_1.default(this.GAME_CANVAS);
        Input_1.default.initialize(this.viewport, this.gameOptions.inputs);
        this.resourceManager = ResourceManager_1.default.getInstance();
        this.sceneManager = new SceneManager_1.default(this.viewport, this.renderingManager);
        this.audioManager = AudioManager_1.default.getInstance();
        this.playbackManager = new PlaybackManager_1.default();
    }
    /**
     * Set up the game window that holds the canvases
     */
    initializeGameWindow() {
        const gameWindow = document.getElementById("game-window");
        // Set the height of the game window
        gameWindow.style.width = this.WIDTH + "px";
        gameWindow.style.height = this.HEIGHT + "px";
    }
    /**
     * Retreives the SceneManager from the Game
     * @returns The SceneManager
     */
    getSceneManager() {
        return this.sceneManager;
    }
    /**
     * Starts the game
     */
    start(InitialScene, options) {
        // Set the update function of the loop
        this.loop.doUpdate = (deltaT) => this.update(deltaT);
        // Set the render function of the loop
        this.loop.doRender = () => this.render();
        // Preload registry items
        RegistryManager_1.default.preload();
        // Load the items with the resource manager
        this.resourceManager.loadResourcesFromQueue(() => {
            // When we're done loading, start the loop
            console.log("Finished Preload - loading first scene");
            this.sceneManager.changeToScene(InitialScene, {}, options);
            this.loop.start();
        });
    }
    /**
     * Updates all necessary subsystems of the game. Defers scene updates to the sceneManager
     * @param deltaT The time sine the last update
     */
    update(deltaT) {
        try {
            // Handle all events that happened since the start of the last loop
            this.eventQueue.update(deltaT);
            // Update the input handler - disabling/enabling user input
            this.inputHandler.update(deltaT);
            // Update the input data structures so game objects can see the input
            Input_1.default.update(deltaT);
            // Update the recording of the game
            this.playbackManager.update(deltaT);
            // Update all scenes
            this.sceneManager.update(deltaT);
            // Update all sounds
            this.audioManager.update(deltaT);
            // Load or unload any resources if needed
            this.resourceManager.update(deltaT);
        }
        catch (e) {
            this.loop.pause();
            console.warn("Uncaught Error in Update - Crashing gracefully");
            console.error(e);
        }
    }
    /**
     * Clears the canvas and defers scene rendering to the sceneManager. Renders the debug canvas
     */
    render() {
        try {
            // Clear the canvases
            Debug_1.default.clearCanvas();
            this.renderingManager.clear(this.clearColor);
            this.sceneManager.render();
            // Hacky debug mode
            if (Input_1.default.isKeyJustPressed("g")) {
                this.showDebug = !this.showDebug;
            }
            // Debug render
            if (this.showDebug) {
                Debug_1.default.render();
            }
            if (this.showStats) {
                Stats_1.default.render();
            }
        }
        catch (e) {
            this.loop.pause();
            console.warn("Uncaught Error in Render - Crashing gracefully");
            console.error(e);
        }
    }
}
exports.default = Game;
},{"../DataTypes/Vec2":23,"../Debug/Debug":24,"../Debug/Stats":25,"../Events/EventQueue":27,"../Input/Input":31,"../Input/InputHandler":32,"../Playback/PlaybackManager":65,"../Registry/RegistryManager":68,"../Rendering/CanvasRenderer":75,"../Rendering/WebGLRenderer":80,"../ResourceManager/ResourceManager":88,"../Scene/SceneManager":99,"../SceneGraph/Viewport":91,"../Sound/AudioManager":101,"../Utils/Color":104,"./EnvironmentInitializer":33,"./FixedUpdateGameLoop":34,"./GameOptions":37}],36:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const NullFunc_1 = __importDefault(require("../DataTypes/Functions/NullFunc"));
/**
 * The main game loop of the game. Keeps track of fps and handles scheduling of updates and rendering.
 * This class is left abstract, so that a subclass can handle exactly how the loop is scheduled.
 * For an example of different types of game loop scheduling, check out @link(Game Programming Patterns)(https://gameprogrammingpatterns.com/game-loop.html)
 */
class GameLoop {
    constructor() {
        /** The function to call when an update occurs */
        this._doUpdate = NullFunc_1.default;
        /** The function to call when a render occurs */
        this._doRender = NullFunc_1.default;
    }
    set doUpdate(update) {
        this._doUpdate = update;
    }
    set doRender(render) {
        this._doRender = render;
    }
}
exports.default = GameLoop;
},{"../DataTypes/Functions/NullFunc":8}],37:[function(require,module,exports){
"use strict";
// @ignorePage
Object.defineProperty(exports, "__esModule", { value: true });
/** The options for initializing the @reference[GameLoop] */
class GameOptions {
    /**
     * Parses the data in the raw options object
     * @param options The game options as a Record
     * @returns A version of the options converted to a GameOptions object
     */
    static parse(options) {
        let gOpt = new GameOptions();
        gOpt.canvasSize = options.canvasSize ? options.canvasSize : { x: 800, y: 600 };
        gOpt.zoomLevel = options.zoomLevel ? options.zoomLevel : 1;
        gOpt.clearColor = options.clearColor ? options.clearColor : { r: 255, g: 255, b: 255 };
        gOpt.inputs = options.inputs ? options.inputs : [];
        gOpt.showDebug = !!options.showDebug;
        gOpt.showStats = !!options.showStats;
        gOpt.useWebGL = !!options.useWebGL;
        return gOpt;
    }
}
exports.default = GameOptions;
},{}],38:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameNode_1 = __importDefault(require("./GameNode"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const AABB_1 = __importDefault(require("../DataTypes/Shapes/AABB"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
const Color_1 = __importDefault(require("../Utils/Color"));
/**
 * The representation of an object in the game world that can be drawn to the screen
 */
class CanvasNode extends GameNode_1.default {
    constructor() {
        super();
        /** A flag for whether or not the CanvasNode is visible */
        this.visible = true;
        this._size = new Vec2_1.default(0, 0);
        this._size.setOnChange(() => this.sizeChanged());
        this._scale = new Vec2_1.default(1, 1);
        this._scale.setOnChange(() => this.scaleChanged());
        this._boundary = new AABB_1.default();
        this.updateBoundary();
        this._hasCustomShader = false;
    }
    get alpha() {
        return this._alpha;
    }
    set alpha(a) {
        this._alpha = a;
    }
    get size() {
        return this._size;
    }
    set size(size) {
        this._size = size;
        // Enter as a lambda to bind "this"
        this._size.setOnChange(() => this.sizeChanged());
        this.sizeChanged();
    }
    get scale() {
        return this._scale;
    }
    set scale(scale) {
        this._scale = scale;
        // Enter as a lambda to bind "this"
        this._scale.setOnChange(() => this.scaleChanged());
        this.scaleChanged();
    }
    set scaleX(value) {
        this.scale.x = value;
    }
    set scaleY(value) {
        this.scale.y = value;
    }
    get hasCustomShader() {
        return this._hasCustomShader;
    }
    get customShaderKey() {
        return this._customShaderKey;
    }
    // @override
    positionChanged() {
        super.positionChanged();
        this.updateBoundary();
    }
    /** Called if the size vector is changed or replaced. */
    sizeChanged() {
        this.updateBoundary();
    }
    /** Called if the scale vector is changed or replaced */
    scaleChanged() {
        this.updateBoundary();
    }
    // @docIgnore
    /** Called if the position, size, or scale of the CanvasNode is changed. Updates the boundary. */
    updateBoundary() {
        this._boundary.center.set(this.position.x, this.position.y);
        this._boundary.halfSize.set(this.size.x * this.scale.x / 2, this.size.y * this.scale.y / 2);
    }
    get boundary() {
        return this._boundary;
    }
    get sizeWithZoom() {
        let zoom = this.scene.getViewScale();
        return this.boundary.halfSize.clone().scaled(zoom, zoom);
    }
    /**
     * Adds a custom shader to this CanvasNode
     * @param key The registry key of the ShaderType
     */
    useCustomShader(key) {
        this._hasCustomShader = true;
        this._customShaderKey = key;
    }
    /**
     * Returns true if the point (x, y) is inside of this canvas object
     * @param x The x position of the point
     * @param y The y position of the point
     * @returns A flag representing whether or not this node contains the point.
     */
    contains(x, y) {
        return this._boundary.containsPoint(new Vec2_1.default(x, y));
    }
    // @implemented
    debugRender() {
        Debug_1.default.drawBox(this.relativePosition, this.sizeWithZoom, false, Color_1.default.BLUE);
        super.debugRender();
    }
}
exports.default = CanvasNode;
},{"../DataTypes/Shapes/AABB":17,"../DataTypes/Vec2":23,"../Debug/Debug":24,"../Utils/Color":104,"./GameNode":39}],39:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenableProperties = void 0;
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const Emitter_1 = __importDefault(require("../Events/Emitter"));
const Region_1 = require("../DataTypes/Interfaces/Region");
const AABB_1 = __importDefault(require("../DataTypes/Shapes/AABB"));
const TweenController_1 = __importDefault(require("../Rendering/Animations/TweenController"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
const Color_1 = __importDefault(require("../Utils/Color"));
const Circle_1 = __importDefault(require("../DataTypes/Shapes/Circle"));
/**
 * The representation of an object in the game world.
 * To construct GameNodes, see the @reference[Scene] documentation.
 */
class GameNode {
    // Constructor docs are ignored, as the user should NOT create new GameNodes with a raw constructor
    constructor() {
        /*---------- PHYSICAL ----------*/
        this.hasPhysics = false;
        this.moving = false;
        this.frozen = false;
        this.onGround = false;
        this.onWall = false;
        this.onCeiling = false;
        this.active = false;
        this.isColliding = false;
        this.pathfinding = false;
        this._position = new Vec2_1.default(0, 0);
        this._position.setOnChange(() => this.positionChanged());
        this.receiver = new Receiver_1.default();
        this.emitter = new Emitter_1.default();
        this.tweens = new TweenController_1.default(this);
        this.rotation = 0;
    }
    destroy() {
        this.tweens.destroy();
        this.receiver.destroy();
        if (this.hasPhysics) {
            this.removePhysics();
        }
        if (this._ai) {
            this._ai.destroy();
            delete this._ai;
            this.scene.getAIManager().removeActor(this);
        }
        this.scene.remove(this);
        this.layer.removeNode(this);
    }
    /*---------- POSITIONED ----------*/
    get position() {
        return this._position;
    }
    set position(pos) {
        this._position = pos;
        this._position.setOnChange(() => this.positionChanged());
        this.positionChanged();
    }
    get relativePosition() {
        return this.inRelativeCoordinates(this.position);
    }
    /**
     * Converts a point to coordinates relative to the zoom and origin of this node
     * @param point The point to conver
     * @returns A new Vec2 representing the point in relative coordinates
     */
    inRelativeCoordinates(point) {
        let origin = this.scene.getViewTranslation(this);
        let zoom = this.scene.getViewScale();
        return point.clone().sub(origin).scale(zoom);
    }
    /*---------- UNIQUE ----------*/
    get id() {
        return this._id;
    }
    set id(id) {
        // id can only be set once
        if (this._id === undefined) {
            this._id = id;
        }
        else {
            throw "Attempted to assign id to object that already has id.";
        }
    }
    /*---------- PHYSICAL ----------*/
    // @implemented
    /**
     * @param velocity The velocity with which to move the object.
     */
    move(velocity) {
        if (this.frozen)
            return;
        this.moving = true;
        this._velocity = velocity;
    }
    ;
    moveOnPath(speed, path) {
        if (this.frozen || path.isDone())
            return;
        this.path = path;
        let dir = path.getMoveDirection(this);
        this.moving = true;
        this.pathfinding = true;
        this._velocity = dir.scale(speed);
    }
    // @implemented
    /**
     * @param velocity The velocity with which the object will move.
     */
    finishMove() {
        this.moving = false;
        this.position.add(this._velocity);
        if (this.pathfinding) {
            this.path.handlePathProgress(this);
            this.path = null;
            this.pathfinding = false;
        }
    }
    // @implemented
    /**
     * @param collisionShape The collider for this object. If this has a region (implements Region),
     * it will be used when no collision shape is specified (or if collision shape is null).
     * @param isCollidable Whether this is collidable or not. True by default.
     * @param isStatic Whether this is static or not. False by default
     */
    addPhysics(collisionShape, colliderOffset, isCollidable = true, isStatic = false) {
        // Initialize the physics variables
        this.hasPhysics = true;
        this.moving = false;
        this.onGround = false;
        this.onWall = false;
        this.onCeiling = false;
        this.active = true;
        this.isCollidable = isCollidable;
        this.isStatic = isStatic;
        this.isTrigger = false;
        this.triggerMask = 0;
        this.triggerEnters = new Array(32);
        this.triggerExits = new Array(32);
        this._velocity = Vec2_1.default.ZERO;
        this.sweptRect = new AABB_1.default();
        this.collidedWithTilemap = false;
        this.group = -1; // The default group, collides with everything
        // Set the collision shape if provided, or simply use the the region if there is one.
        if (collisionShape) {
            this.collisionShape = collisionShape;
            this.collisionShape.center = this.position;
        }
        else if ((0, Region_1.isRegion)(this)) {
            // If the gamenode has a region and no other is specified, use that
            this.collisionShape = this.boundary.clone();
        }
        else {
            throw "No collision shape specified for physics object.";
        }
        // If we were provided with a collider offset, set it. Otherwise there is no offset, so use the zero vector
        if (colliderOffset) {
            this.colliderOffset = colliderOffset;
        }
        else {
            this.colliderOffset = Vec2_1.default.ZERO;
        }
        // Initialize the swept rect
        this.sweptRect = this.collisionShape.getBoundingRect();
        // Register the object with physics
        this.scene.getPhysicsManager().registerObject(this);
    }
    /** Removes this object from the physics system */
    removePhysics() {
        // Remove this from the physics manager
        this.scene.getPhysicsManager().deregisterObject(this);
        // Nullify all physics fields
        this.hasPhysics = false;
        this.moving = false;
        this.onGround = false;
        this.onWall = false;
        this.onCeiling = false;
        this.active = false;
        this.isCollidable = false;
        this.isStatic = false;
        this.isTrigger = false;
        this.triggerMask = 0;
        this.triggerEnters = null;
        this.triggerExits = null;
        this._velocity = Vec2_1.default.ZERO;
        this.sweptRect = null;
        this.collidedWithTilemap = false;
        this.group = -1;
        this.collisionShape = null;
        this.colliderOffset = Vec2_1.default.ZERO;
        this.sweptRect = null;
    }
    /** Disables physics movement for this node */
    freeze() {
        this.frozen = true;
    }
    /** Reenables physics movement for this node */
    unfreeze() {
        this.frozen = false;
    }
    /** Prevents this object from participating in all collisions and triggers. It can still move. */
    disablePhysics() {
        this.active = false;
    }
    /** Enables this object to participate in collisions and triggers. This is only necessary if disablePhysics was called */
    enablePhysics() {
        this.active = true;
    }
    /**
     * Sets the collider for this GameNode
     * @param collider The new collider to use
     */
    setCollisionShape(collider) {
        this.collisionShape = collider;
        this.collisionShape.center.copy(this.position);
    }
    // @implemented
    /**
     * Sets this object to be a trigger for a specific group
     * @param group The name of the group that activates the trigger
     * @param onEnter The name of the event to send when this trigger is activated
     * @param onExit The name of the event to send when this trigger stops being activated
     */
    setTrigger(group, onEnter, onExit) {
        // Make this object a trigger
        this.isTrigger = true;
        // Get the number of the physics layer
        let layerNumber = this.scene.getPhysicsManager().getGroupNumber(group);
        if (layerNumber === 0) {
            console.warn(`Trigger for GameNode ${this.id} not set - group "${group}" was not recognized by the physics manager.`);
            return;
        }
        // Add this to the trigger mask
        this.triggerMask |= layerNumber;
        // Layer numbers are bits, so get which bit it is
        let index = Math.log2(layerNumber);
        // Set the event names
        this.triggerEnters[index] = onEnter;
        this.triggerExits[index] = onExit;
    }
    ;
    // @implemented
    /**
     * @param group The physics group this node should belong to
     */
    setGroup(group) {
        this.scene.getPhysicsManager().setGroup(this, group);
    }
    // @implemened
    getLastVelocity() {
        return this._velocity;
    }
    /*---------- ACTOR ----------*/
    get ai() {
        return this._ai;
    }
    set ai(ai) {
        if (!this._ai) {
            // If we haven't been previously had an ai, register us with the ai manager
            this.scene.getAIManager().registerActor(this);
        }
        this._ai = ai;
        this.aiActive = true;
    }
    // @implemented
    addAI(ai, options, type) {
        if (!this._ai) {
            this.scene.getAIManager().registerActor(this);
        }
        if (typeof ai === "string") {
            this._ai = this.scene.getAIManager().generateAI(ai);
        }
        else {
            this._ai = new ai();
        }
        // Question, how much do we want different type of AI to be handled the same, i.e. should GoapAI and AI similar methods and signatures for the sake of unity
        this._ai.initializeAI(this, options);
        this.aiActive = true;
    }
    // @implemented
    setAIActive(active, options) {
        this.aiActive = active;
        if (this.aiActive) {
            this.ai.activate(options);
        }
    }
    /*---------- TWEENABLE PROPERTIES ----------*/
    set positionX(value) {
        this.position.x = value;
    }
    set positionY(value) {
        this.position.y = value;
    }
    /*---------- GAME NODE ----------*/
    /**
     * Sets the scene for this object.
     * @param scene The scene this object belongs to.
     */
    setScene(scene) {
        this.scene = scene;
    }
    /**
     * Gets the scene this object is in.
     * @returns The scene this object belongs to
    */
    getScene() {
        return this.scene;
    }
    /**
     * Sets the layer of this object.
     * @param layer The layer this object will be on.
     */
    setLayer(layer) {
        this.layer = layer;
    }
    /**
     * Returns the layer this object is on.
     * @returns This layer this object is on.
    */
    getLayer() {
        return this.layer;
    }
    /** Called if the position vector is modified or replaced */
    positionChanged() {
        if (this.collisionShape) {
            if (this.colliderOffset) {
                this.collisionShape.center = this.position.clone().add(this.colliderOffset);
            }
            else {
                this.collisionShape.center = this.position.clone();
            }
        }
    }
    ;
    /**
     * Updates this GameNode
     * @param deltaT The timestep of the update.
     */
    update(deltaT) {
        // Defer event handling to AI.
        while (this.receiver.hasNextEvent()) {
            this._ai.handleEvent(this.receiver.getNextEvent());
        }
    }
    // @implemented
    debugRender() {
        // Draw the position of this GameNode
        Debug_1.default.drawPoint(this.relativePosition, Color_1.default.BLUE);
        // If velocity is not zero, draw a vector for it
        if (this._velocity && !this._velocity.isZero()) {
            Debug_1.default.drawRay(this.relativePosition, this._velocity.clone().scaleTo(20).add(this.relativePosition), Color_1.default.BLUE);
        }
        // If this has a collider, draw it
        if (this.collisionShape) {
            let color = this.isColliding ? Color_1.default.RED : Color_1.default.GREEN;
            if (this.isTrigger) {
                color = Color_1.default.MAGENTA;
            }
            color.a = 0.2;
            if (this.collisionShape instanceof AABB_1.default) {
                Debug_1.default.drawBox(this.inRelativeCoordinates(this.collisionShape.center), this.collisionShape.halfSize.scaled(this.scene.getViewScale()), true, color);
            }
            else if (this.collisionShape instanceof Circle_1.default) {
                Debug_1.default.drawCircle(this.inRelativeCoordinates(this.collisionShape.center), this.collisionShape.hw * this.scene.getViewScale(), true, color);
            }
        }
    }
}
exports.default = GameNode;
var TweenableProperties;
(function (TweenableProperties) {
    TweenableProperties["posX"] = "positionX";
    TweenableProperties["posY"] = "positionY";
    TweenableProperties["scaleX"] = "scaleX";
    TweenableProperties["scaleY"] = "scaleY";
    TweenableProperties["rotation"] = "rotation";
    TweenableProperties["alpha"] = "alpha";
})(TweenableProperties = exports.TweenableProperties || (exports.TweenableProperties = {}));
},{"../DataTypes/Interfaces/Region":12,"../DataTypes/Shapes/AABB":17,"../DataTypes/Shapes/Circle":18,"../DataTypes/Vec2":23,"../Debug/Debug":24,"../Events/Emitter":26,"../Events/Receiver":30,"../Rendering/Animations/TweenController":73,"../Utils/Color":104}],40:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CanvasNode_1 = __importDefault(require("./CanvasNode"));
const Color_1 = __importDefault(require("../Utils/Color"));
/**
 * The representation of a game object that doesn't rely on any resources to render - it is drawn to the screen by the canvas
 */
class Graphic extends CanvasNode_1.default {
    constructor() {
        super();
        this.color = Color_1.default.RED;
    }
    get alpha() {
        return this.color.a;
    }
    set alpha(a) {
        this.color.a = a;
    }
    // @deprecated
    /**
     * Sets the color of the Graphic. DEPRECATED
     * @param color The new color of the Graphic.
     */
    setColor(color) {
        this.color = color;
    }
    set colorR(r) {
        this.color.r = r;
    }
    get colorR() {
        return this.color.r;
    }
    set colorG(g) {
        this.color.g = g;
    }
    get colorG() {
        return this.color.g;
    }
    set colorB(b) {
        this.color.b = b;
    }
    get colorB() {
        return this.color.b;
    }
}
exports.default = Graphic;
},{"../Utils/Color":104,"./CanvasNode":38}],41:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphicType = void 0;
var GraphicType;
(function (GraphicType) {
    GraphicType["POINT"] = "POINT";
    GraphicType["RECT"] = "RECT";
    GraphicType["LINE"] = "LINE";
    GraphicType["PARTICLE"] = "PARTICLE";
    GraphicType["SPOTLIGHT"] = "SPOTLIGHT";
    GraphicType["LIGHT_MASK"] = "LIGHT_MASK";
})(GraphicType = exports.GraphicType || (exports.GraphicType = {}));
},{}],42:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graphic_1 = __importDefault(require("../Graphic"));
class Line extends Graphic_1.default {
    constructor(start, end) {
        super();
        this.start = start;
        this.end = end;
        this.thickness = 2;
        // Does this really have a meaning for lines?
        this.size.set(5, 5);
    }
    set start(pos) {
        this.position = pos;
    }
    get start() {
        return this.position;
    }
    set end(pos) {
        this._end = pos;
    }
    get end() {
        return this._end;
    }
}
exports.default = Line;
},{"../Graphic":40}],43:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Point_1 = __importDefault(require("./Point"));
/**
 * - Position X
- Velocity (speed and direction) X
- Color X
- Lifetime
- Age can be handled as lifetime
- Shape X
- Size X
- Transparency X
 */
class Particle extends Point_1.default {
    constructor(position, size, mass) {
        // Are we making this a circle?
        super(position);
        this.inUse = false;
        this.mass = mass;
    }
    setParticleActive(lifetime, position) {
        this.age = lifetime;
        this.inUse = true;
        this.visible = true;
        this.position = position;
    }
    decrementAge(decay) {
        this.age -= decay;
    }
    setParticleInactive() {
        this.inUse = false;
        this.visible = false;
    }
    set velY(y) {
        this.vel.y = y;
    }
    get velY() {
        return this.vel.y;
    }
}
exports.default = Particle;
},{"./Point":44}],44:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graphic_1 = __importDefault(require("../Graphic"));
/** A basic point to be drawn on the screen. */
class Point extends Graphic_1.default {
    constructor(position) {
        // Are we making this a circle?
        super();
        this.position = position;
        this.size.set(5, 5);
    }
}
exports.default = Point;
},{"../Graphic":40}],45:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graphic_1 = __importDefault(require("../Graphic"));
const Color_1 = __importDefault(require("../../Utils/Color"));
/** A basic rectangle to be drawn on the screen. */
class Rect extends Graphic_1.default {
    constructor(position, size) {
        super();
        this.position = position;
        this.size = size;
        this.borderColor = Color_1.default.TRANSPARENT;
        this.borderWidth = 0;
    }
    /**
     * Sets the border color of this rectangle
     * @param color The border color
     */
    setBorderColor(color) {
        this.borderColor = color;
    }
    // @deprecated
    getBorderColor() {
        return this.borderColor;
    }
    /**
     * Sets the border width of this rectangle
     * @param width The width of the rectangle in pixels
     */
    setBorderWidth(width) {
        this.borderWidth = width;
    }
    getBorderWidth() {
        return this.borderWidth;
    }
}
exports.default = Rect;
},{"../../Utils/Color":104,"../Graphic":40}],46:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sprite_1 = __importDefault(require("./Sprite"));
const AnimationManager_1 = __importDefault(require("../../Rendering/Animations/AnimationManager"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
/** An sprite with specified animation frames. */
class AnimatedSprite extends Sprite_1.default {
    constructor(spritesheet) {
        super(spritesheet.name);
        this.numCols = spritesheet.columns;
        this.numRows = spritesheet.rows;
        // Set the size of the sprite to the sprite size specified by the spritesheet
        this.size.set(spritesheet.spriteWidth, spritesheet.spriteHeight);
        this.animation = new AnimationManager_1.default(this);
        // Add the animations to the animated sprite
        for (let animation of spritesheet.animations) {
            this.animation.add(animation.name, animation);
        }
    }
    get cols() {
        return this.numCols;
    }
    get rows() {
        return this.numRows;
    }
    /**
     * Gets the image offset for the current index of animation
     * @param index The index we're at in the animation
     * @returns A Vec2 containing the image offset
     */
    getAnimationOffset(index) {
        return new Vec2_1.default((index % this.numCols) * this.size.x, Math.floor(index / this.numCols) * this.size.y);
    }
}
exports.default = AnimatedSprite;
},{"../../DataTypes/Vec2":23,"../../Rendering/Animations/AnimationManager":69,"./Sprite":47}],47:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CanvasNode_1 = __importDefault(require("../CanvasNode"));
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
/**
 * The representation of a sprite - an in-game image
 */
class Sprite extends CanvasNode_1.default {
    constructor(imageId) {
        super();
        this.imageId = imageId;
        let image = ResourceManager_1.default.getInstance().getImage(this.imageId);
        this.size = new Vec2_1.default(image.width, image.height);
        this.imageOffset = Vec2_1.default.ZERO;
        this.invertX = false;
        this.invertY = false;
    }
    /**
     * Sets the offset of the sprite from (0, 0) in the image's coordinates
     * @param offset The offset of the sprite from (0, 0) in image coordinates
     */
    setImageOffset(offset) {
        this.imageOffset = offset;
    }
}
exports.default = Sprite;
},{"../../DataTypes/Vec2":23,"../../ResourceManager/ResourceManager":88,"../CanvasNode":38}],48:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const CanvasNode_1 = __importDefault(require("./CanvasNode"));
/**
 * The representation of a tilemap - this can consist of a combination of tilesets in one layer
 */
class Tilemap extends CanvasNode_1.default {
    // TODO: Make this no longer be specific to Tiled
    constructor(tilemapData, layer, tilesets, scale) {
        super();
        this.tilesets = tilesets;
        this.tileSize = new Vec2_1.default(0, 0);
        this.name = layer.name;
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
        let tilecount = 0;
        for (let tileset of tilesets) {
            tilecount += tileset.getTileCount() + 1;
        }
        this.collisionMap = new Array(tilecount);
        for (let i = 0; i < this.collisionMap.length; i++) {
            this.collisionMap[i] = false;
        }
        // Defer parsing of the data to child classes - this allows for isometric vs. orthographic tilemaps and handling of Tiled data or other data
        this.parseTilemapData(tilemapData, layer);
        this.scale.set(scale.x, scale.y);
    }
    get name() { return this._name; }
    set name(name) { this._name = name; }
    /**
     * Gets the data value of the tile at the specified index
     * @param index The index of the tile
     * @returns The data value of the tile
     */
    getTile(col, row) {
        let index = this.getTileIndex(col, row);
        if (index === -1) {
            return -1;
        }
        return this.data[index];
    }
    /**
     * Gets the index of the tile in the tilemaps backing array.
     * @param position the position in row-column format in the backing array of the tilemap
     * @returns the index of position in the tilemap
     */
    getTileIndex(col, row) {
        if (col < 0 || col >= this.numCols || row < 0 || row >= this.numRows) {
            return -1;
        }
        return row * this.numCols + col;
    }
    /**
     * Gets the column and row of a tile in the tilemap from the index of the tile
     * in the backing array.
     * @param index the index of the tile in the backing array
     * @return a Vec2 containing the column and row indices of the tile
     */
    getTileColRow(index) {
        let col = index % this.numCols;
        let row = Math.floor(index / this.numCols);
        return new Vec2_1.default(col, row);
    }
    /**
     * Sets the tile at the specified position to the given tile.
     * @param position the row and column of the tile in the backing array
     * @param tile the number of the tile to set
     */
    setTile(col, row, tile) {
        let index = this.getTileIndex(col, row);
        if (index !== -1) {
            this.data[index] = tile;
        }
    }
    /**
     * Returns an array of the tilesets associated with this tilemap
     * @returns An array of all of the tilesets assocaited with this tilemap.
     */
    getTilesets() {
        return this.tilesets;
    }
    /**
     * Gets the dimensions of the tilemap
     * @returns A Vec2 containing the number of columns and the number of rows in the tilemap.
     */
    getDimensions() {
        return new Vec2_1.default(this.numCols, this.numRows);
    }
    // Methods for getting the size of a tile
    /**
     * Gets the raw size of the tiles, without any scaling or zooming.
     * @returns the size of the tiles in this tilemap
     */
    getTileSize() {
        return this.tileSize;
    }
    /**
     * Returns the size of tiles in this tilemap as they appear in the game world after scaling
     * @returns A vector containing the size of tiles in this tilemap as they appear in the game world after scaling.
     */
    getScaledTileSize() {
        return this.getTileSize().scaled(this.scale.x, this.scale.y);
    }
    /**
     * Returns true if the tile at the specified row and column of the tilemap is collidable
     * @param col the specified column
     * @param row the specified row
     * @returns A flag representing whether or not the tile is collidable.
     */
    isTileCollidable(col, row) {
        if (col < 0 || col >= this.numCols || row < 0 || row >= this.numRows) {
            return false;
        }
        return this.collisionMap[this.getTile(col, row)];
    }
    /**
     * Adds this tilemap to the physics system
     */
    addPhysics() {
        this.hasPhysics = true;
        this.active = true;
        this.group = -1;
        this.scene.getPhysicsManager().registerTilemap(this);
    }
}
exports.default = Tilemap;
},{"../DataTypes/Vec2":23,"./CanvasNode":38}],49:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Debug_1 = __importDefault(require("../../Debug/Debug"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const Tilemap_1 = __importDefault(require("../Tilemap"));
class IsometricTilemap extends Tilemap_1.default {
    getMinColRow(region) {
        return new Vec2_1.default(0, 0);
    }
    getMaxColRow(region) {
        return new Vec2_1.default(this.numCols, this.numRows);
    }
    getWorldPosition(col, row) {
        if (col < 0 || col > this.numCols || row < 0 || row > this.numRows) {
            return null;
        }
        let vpx = this.scene.getViewport().getHalfSize().x;
        let x = Math.floor(this.scale.x * this.tileSize.x / 2 * (col - row) + vpx);
        let y = Math.floor(this.scale.y * this.tileSize.y / 2 * (col + row));
        return new Vec2_1.default(x, y);
    }
    getTilemapPosition(x, y) {
        let vpx = this.scene.getViewport().getHalfSize().x;
        let col = Math.floor((x - vpx) / this.scale.x / this.tileSize.x + y / this.scale.y / this.tileSize.y);
        let row = Math.floor(y / this.scale.y / this.tileSize.y - (x - vpx) / this.scale.x / this.tileSize.x);
        if (col < 0 || col > this.numCols || row < 0 || row > this.numRows) {
            return null;
        }
        return new Vec2_1.default(col, row);
    }
    getTileCollider(col, row) {
        return;
    }
    parseTilemapData(tilemapData, layer) {
        // The size of the tilemap in local space
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
        // The size of tiles
        this.tileSize.set(tilemapData.tilewidth, tilemapData.tileheight);
        // The size of the tilemap on the canvas
        this.size.set(this.numCols * this.tileSize.x, this.numRows * this.tileSize.y);
        this.position.copy(this.size.scaled(0.5));
        this.data = layer.data;
        this.visible = layer.visible;
        // Whether the tilemap is collidable or not
        this.isCollidable = false;
        if (layer.properties) {
            for (let item of layer.properties) {
                if (item.name === "Collidable") {
                    this.isCollidable = item.value;
                    // Set all tiles besides "empty: 0" to be collidable
                    for (let i = 1; i < this.collisionMap.length; i++) {
                        this.collisionMap[i] = true;
                    }
                }
            }
        }
    }
    debugRender() {
        for (let tile = 0; tile < this.data.length; tile++) {
            let pos = this.getTileColRow(tile);
            Debug_1.default.drawPoint(this.getWorldPosition(pos.x, pos.y), Color_1.default.BLUE);
        }
    }
}
exports.default = IsometricTilemap;
},{"../../DataTypes/Vec2":23,"../../Debug/Debug":24,"../../Utils/Color":104,"../Tilemap":48}],50:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Tilemap_1 = __importDefault(require("../Tilemap"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Debug_1 = __importDefault(require("../../Debug/Debug"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const AABB_1 = __importDefault(require("../../DataTypes/Shapes/AABB"));
/**
 * The representation of an orthogonal tilemap - i.e. a top down or platformer tilemap
 */
class OrthogonalTilemap extends Tilemap_1.default {
    getMinColRow(region) {
        return this.getTilemapPosition(region.topLeft.x, region.topLeft.y);
    }
    getMaxColRow(region) {
        return this.getTilemapPosition(region.bottomRight.x, region.bottomRight.y);
    }
    getTilemapPosition(x, y) {
        let col = Math.floor(x / this.tileSize.x / this.scale.x);
        let row = Math.floor(y / this.tileSize.y / this.scale.y);
        return new Vec2_1.default(col, row);
    }
    getWorldPosition(col, row) {
        let x = col * this.tileSize.x * this.scale.x;
        let y = row * this.tileSize.y * this.scale.y;
        return new Vec2_1.default(x, y);
    }
    getTileCollider(col, row) {
        let tileSize = this.getScaledTileSize();
        let centerX = col * tileSize.x + tileSize.x / 2;
        let centerY = row * tileSize.y + tileSize.y / 2;
        let center = new Vec2_1.default(centerX, centerY);
        let halfSize = tileSize.scaled(0.5);
        return new AABB_1.default(center, halfSize);
    }
    parseTilemapData(tilemapData, layer) {
        // The size of the tilemap in local space
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
        // The size of tiles
        this.tileSize.set(tilemapData.tilewidth, tilemapData.tileheight);
        // The size of the tilemap on the canvas
        this.size.set(this.numCols * this.tileSize.x, this.numRows * this.tileSize.y);
        this.position.copy(this.size.scaled(0.5));
        this.data = layer.data;
        this.visible = layer.visible;
        // Whether the tilemap is collidable or not
        this.isCollidable = false;
        if (layer.properties) {
            for (let item of layer.properties) {
                if (item.name === "Collidable") {
                    this.isCollidable = item.value;
                    // Set all tiles besides "empty: 0" to be collidable
                    for (let i = 1; i < this.collisionMap.length; i++) {
                        this.collisionMap[i] = true;
                    }
                }
            }
        }
    }
    // @override
    update(deltaT) { }
    // @override
    debugRender() {
        for (let i = 0; i < this.data.length; i++) {
            let cr = this.getTileColRow(i);
            if (this.isCollidable && this.isTileCollidable(cr.x, cr.y)) {
                let box = this.getTileCollider(cr.x, cr.y);
                Debug_1.default.drawBox(this.inRelativeCoordinates(box.center), box.halfSize.scale(this.scene.getViewScale()), false, Color_1.default.BLUE);
            }
        }
    }
}
exports.default = OrthogonalTilemap;
},{"../../DataTypes/Shapes/AABB":17,"../../DataTypes/Vec2":23,"../../Debug/Debug":24,"../../Utils/Color":104,"../Tilemap":48}],51:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AABB_1 = __importDefault(require("../../DataTypes/Shapes/AABB"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Debug_1 = __importDefault(require("../../Debug/Debug"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const Tilemap_1 = __importDefault(require("../Tilemap"));
class StaggeredIsometricTilemap extends Tilemap_1.default {
    getTilemapPosition(x, y) {
        let col = x / this.tileSize.x / this.scale.x;
        let row = Math.floor(y / this.tileSize.y / this.scale.y * 2);
        if (row % 2 !== 0) {
            col = (x - this.tileSize.x / this.scale.x / 2) / this.tileSize.x / this.scale.x;
        }
        return new Vec2_1.default(Math.floor(col), row);
    }
    getWorldPosition(col, row) {
        let x = col * this.tileSize.x * this.scale.x;
        let y = row * this.tileSize.y / 2 * this.scale.y;
        if (row % 2 !== 0) {
            x += this.tileSize.x * this.scale.x / 2;
        }
        return new Vec2_1.default(Math.floor(x), Math.floor(y));
    }
    getTileCollider(col, row) {
        let tileSize = this.getScaledTileSize();
        let centerX = col * tileSize.x + tileSize.x / 2;
        let centerY = row * tileSize.y / 2 + tileSize.y + tileSize.y / 2;
        if (row % 2 !== 0) {
            centerX += tileSize.x / 2;
        }
        let center = new Vec2_1.default(centerX, centerY);
        let halfSize = tileSize.scaled(0.5);
        return new AABB_1.default(center, halfSize);
    }
    getMinColRow(region) {
        return new Vec2_1.default(0, 0);
    }
    getMaxColRow(region) {
        return new Vec2_1.default(this.numCols, this.numRows);
    }
    parseTilemapData(tilemapData, layer) {
        // The size of the tilemap in local space
        this.numCols = tilemapData.width;
        this.numRows = tilemapData.height;
        // The size of tiles
        this.tileSize.set(tilemapData.tilewidth, tilemapData.tileheight);
        // The size of the tilemap on the canvas
        this.size.set(this.numCols * this.tileSize.x, this.numRows * this.tileSize.y);
        this.position.copy(this.size.scaled(0.5));
        this.data = layer.data;
        this.visible = layer.visible;
        // Whether the tilemap is collidable or not
        this.isCollidable = false;
        if (layer.properties) {
            for (let item of layer.properties) {
                if (item.name === "Collidable") {
                    this.isCollidable = item.value;
                    // Set all tiles besides "empty: 0" to be collidable
                    for (let i = 1; i < this.collisionMap.length; i++) {
                        this.collisionMap[i] = true;
                    }
                }
            }
        }
    }
    debugRender() {
        for (let i = 0; i < this.data.length; i++) {
            let rc = this.getTileColRow(i);
            let box = this.getTileCollider(rc.x, rc.y);
            Debug_1.default.drawBox(this.inRelativeCoordinates(box.center), box.halfSize.scale(this.scene.getViewScale()), false, Color_1.default.BLUE);
        }
    }
}
exports.default = StaggeredIsometricTilemap;
},{"../../DataTypes/Shapes/AABB":17,"../../DataTypes/Vec2":23,"../../Debug/Debug":24,"../../Utils/Color":104,"../Tilemap":48}],52:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CanvasNode_1 = __importDefault(require("./CanvasNode"));
const Color_1 = __importDefault(require("../Utils/Color"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const Input_1 = __importDefault(require("../Input/Input"));
/**
 * The representation of a UIElement - the parent class of things like buttons
 */
class UIElement extends CanvasNode_1.default {
    constructor(position) {
        super();
        this.position = position;
        this.backgroundColor = new Color_1.default(0, 0, 0, 0);
        this.borderColor = new Color_1.default(0, 0, 0, 0);
        this.borderRadius = 5;
        this.borderWidth = 1;
        this.padding = Vec2_1.default.ZERO;
        this.onClick = null;
        this.onClickEventId = null;
        this.onRelease = null;
        this.onReleaseEventId = null;
        this.onEnter = null;
        this.onEnterEventId = null;
        this.onLeave = null;
        this.onLeaveEventId = null;
        this.isClicked = false;
        this.isEntered = false;
    }
    // @deprecated
    setBackgroundColor(color) {
        this.backgroundColor = color;
    }
    // @deprecated
    setPadding(padding) {
        this.padding.copy(padding);
    }
    update(deltaT) {
        super.update(deltaT);
        // See of this object was just clicked
        if (Input_1.default.isMouseJustPressed()) {
            let clickPos = Input_1.default.getMousePressPosition();
            if (this.contains(clickPos.x, clickPos.y) && this.visible && !this.layer.isHidden()) {
                this.isClicked = true;
                if (this.onClick !== null) {
                    this.onClick();
                }
                if (this.onClickEventId !== null) {
                    let data = {};
                    this.emitter.fireEvent(this.onClickEventId, data);
                }
            }
        }
        // If the mouse wasn't just pressed, then we definitely weren't clicked
        if (!Input_1.default.isMousePressed()) {
            if (this.isClicked) {
                this.isClicked = false;
            }
        }
        // Check if the mouse is hovering over this element
        let mousePos = Input_1.default.getMousePosition();
        if (mousePos && this.contains(mousePos.x, mousePos.y)) {
            this.isEntered = true;
            if (this.onEnter !== null) {
                this.onEnter();
            }
            if (this.onEnterEventId !== null) {
                let data = {};
                this.emitter.fireEvent(this.onEnterEventId, data);
            }
        }
        else if (this.isEntered) {
            this.isEntered = false;
            if (this.onLeave !== null) {
                this.onLeave();
            }
            if (this.onLeaveEventId !== null) {
                let data = {};
                this.emitter.fireEvent(this.onLeaveEventId, data);
            }
        }
        else if (this.isClicked) {
            // If mouse is dragged off of element while down, it is not clicked anymore
            this.isClicked = false;
        }
    }
    /**
     * Overridable method for calculating background color - useful for elements that want to be colored on different after certain events
     * @returns The background color of the UIElement
     */
    calculateBackgroundColor() {
        return this.backgroundColor;
    }
    /**
     * Overridable method for calculating border color - useful for elements that want to be colored on different after certain events
     * @returns The border color of the UIElement
     */
    calculateBorderColor() {
        return this.borderColor;
    }
}
exports.default = UIElement;
},{"../DataTypes/Vec2":23,"../Input/Input":31,"../Utils/Color":104,"./CanvasNode":38}],53:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Label_1 = __importDefault(require("./Label"));
const Color_1 = __importDefault(require("../../Utils/Color"));
/** A clickable button UIElement */
class Button extends Label_1.default {
    constructor(position, text) {
        super(position, text);
        this.isDisabled = false;
        this.sizeToText();
        this.backgroundColor = new Color_1.default(150, 75, 203);
        this.borderColor = new Color_1.default(41, 46, 30);
        this.textColor = new Color_1.default(255, 255, 255);
    }
    // @override
    calculateBackgroundColor() {
        // Change the background color if clicked or hovered
        if (this.isEntered && !this.isClicked) {
            return this.backgroundColor.lighten();
        }
        else if (this.isClicked) {
            return this.backgroundColor.darken();
        }
        else {
            return this.backgroundColor;
        }
    }
    buttonStyle(backgroundColor, textColor, size, fontStr) {
        this.setBackgroundColor(backgroundColor);
        this.setTextColor(textColor);
        this.size.x = size.x;
        this.size.y = size.y;
        this.font = fontStr;
        this.updateSize();
    }
    disable() {
        this.isDisabled = true;
        this.buttonStyle(new Color_1.default(100, 100, 100), new Color_1.default(255, 255, 255), this.size, this.font);
        this.updateSize();
    }
    enable() {
        this.isDisabled = false;
        this.buttonStyle(new Color_1.default(150, 75, 203), new Color_1.default(255, 255, 255), this.size, this.font);
        this.updateSize();
    }
    updateSize() {
        // Get the canvas to measure the text width
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
            this.handleInitialSizing(ctx);
        }
    }
}
exports.default = Button;
},{"../../Utils/Color":104,"./Label":54}],54:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HAlign = exports.VAlign = void 0;
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const UIElement_1 = __importDefault(require("../UIElement"));
/** A basic text-containing label */
class Label extends UIElement_1.default {
    constructor(position, text) {
        super(position);
        this.text = text;
        this.textColor = new Color_1.default(0, 0, 0, 1);
        this.font = "Arial";
        this.fontSize = 30;
        this.hAlign = "center";
        this.vAlign = "center";
        this.sizeAssigned = false;
    }
    // @deprecated
    setText(text) {
        this.text = text;
    }
    // @deprecated
    setTextColor(color) {
        this.textColor = color;
    }
    /**
     * Gets a string containg the font details for rendering
     * @returns A string containing the font details
     */
    getFontString() {
        return this.fontSize + "px " + this.font;
    }
    /**
     * Overridable method for calculating text color - useful for elements that want to be colored on different after certain events
     * @returns a string containg the text color
     */
    calculateTextColor() {
        return this.textColor.toStringRGBA();
    }
    /**
     * Uses the canvas to calculate the width of the text
     * @param ctx The rendering context
     * @returns A number representing the rendered text width
     */
    calculateTextWidth(ctx) {
        ctx.font = this.fontSize + "px " + this.font;
        return ctx.measureText(this.text).width;
    }
    setHAlign(align) {
        this.hAlign = align;
    }
    setVAlign(align) {
        this.vAlign = align;
    }
    /**
     * Calculate the offset of the text - this is used for rendering text with different alignments
     * @param ctx The rendering context
     * @returns The offset of the text in a Vec2
     */
    calculateTextOffset(ctx) {
        let textWidth = this.calculateTextWidth(ctx);
        let offset = new Vec2_1.default(0, 0);
        let hDiff = this.size.x - textWidth;
        if (this.hAlign === HAlign.CENTER) {
            offset.x = hDiff / 2;
        }
        else if (this.hAlign === HAlign.RIGHT) {
            offset.x = hDiff;
        }
        if (this.vAlign === VAlign.TOP) {
            ctx.textBaseline = "top";
            offset.y = 0;
        }
        else if (this.vAlign === VAlign.BOTTOM) {
            ctx.textBaseline = "bottom";
            offset.y = this.size.y;
        }
        else {
            ctx.textBaseline = "middle";
            offset.y = this.size.y / 2;
        }
        return offset;
    }
    sizeChanged() {
        super.sizeChanged();
        this.sizeAssigned = true;
    }
    /**
     * Automatically sizes the element to the text within it
     * @param ctx The rendering context
     */
    autoSize(ctx) {
        let width = this.calculateTextWidth(ctx);
        let height = this.fontSize;
        this.size.set(width + this.padding.x * 2, height + this.padding.y * 2);
        this.sizeAssigned = true;
    }
    /**
     * Initially assigns a size to the UIElement if none is provided
     * @param ctx The rendering context
     */
    handleInitialSizing(ctx) {
        if (!this.sizeAssigned) {
            this.autoSize(ctx);
        }
    }
    /** On the next render, size this element to it's current text using its current font size */
    sizeToText() {
        this.sizeAssigned = false;
    }
}
exports.default = Label;
var VAlign;
(function (VAlign) {
    VAlign["TOP"] = "top";
    VAlign["CENTER"] = "center";
    VAlign["BOTTOM"] = "bottom";
})(VAlign = exports.VAlign || (exports.VAlign = {}));
var HAlign;
(function (HAlign) {
    HAlign["LEFT"] = "left";
    HAlign["CENTER"] = "center";
    HAlign["RIGHT"] = "right";
})(HAlign = exports.HAlign || (exports.HAlign = {}));
},{"../../DataTypes/Vec2":23,"../../Utils/Color":104,"../UIElement":52}],55:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Input_1 = __importDefault(require("../../Input/Input"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const MathUtils_1 = __importDefault(require("../../Utils/MathUtils"));
const UIElement_1 = __importDefault(require("../UIElement"));
/** A slider UIElement */
class Slider extends UIElement_1.default {
    constructor(position, initValue) {
        super(position);
        this.value = initValue;
        this.nibColor = Color_1.default.RED;
        this.sliderColor = Color_1.default.BLACK;
        this.backgroundColor = Color_1.default.TRANSPARENT;
        this.borderColor = Color_1.default.TRANSPARENT;
        this.nibSize = new Vec2_1.default(10, 20);
        // Set a default size
        this.size.set(200, 20);
    }
    /**
     * Retrieves the value of the slider
     * @returns The value of the slider
     */
    getValue() {
        return this.value;
    }
    /** A method called in response to the value changing */
    valueChanged() {
        if (this.onValueChange) {
            this.onValueChange(this.value);
        }
        if (this.onValueChangeEventId) {
            this.emitter.fireEvent(this.onValueChangeEventId, { target: this, value: this.value });
        }
    }
    update(deltaT) {
        super.update(deltaT);
        if (this.isClicked) {
            let val = MathUtils_1.default.invLerp(this.position.x - this.size.x / 2, this.position.x + this.size.x / 2, Input_1.default.getMousePosition().x);
            this.value = MathUtils_1.default.clamp01(val);
            this.valueChanged();
        }
    }
}
exports.default = Slider;
},{"../../DataTypes/Vec2":23,"../../Input/Input":31,"../../Utils/Color":104,"../../Utils/MathUtils":107,"../UIElement":52}],56:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Color_1 = __importDefault(require("../../Utils/Color"));
const Label_1 = __importDefault(require("./Label"));
const Input_1 = __importDefault(require("../../Input/Input"));
/** A text input UIElement */
class TextInput extends Label_1.default {
    constructor(position) {
        super(position, "");
        this.focused = false;
        this.cursorCounter = 0;
        // Give a default size to the x only
        this.size.set(200, this.fontSize);
        this.hAlign = "left";
        this.borderColor = Color_1.default.BLACK;
        this.backgroundColor = Color_1.default.WHITE;
    }
    update(deltaT) {
        super.update(deltaT);
        if (Input_1.default.isMouseJustPressed()) {
            let clickPos = Input_1.default.getMousePressPosition();
            if (this.contains(clickPos.x, clickPos.y)) {
                this.focused = true;
                this.cursorCounter = 30;
            }
            else {
                this.focused = false;
            }
        }
        if (this.focused) {
            let keys = Input_1.default.getKeysJustPressed();
            let nums = "1234567890";
            let specialChars = "`~!@#$%^&*()-_=+[{]}\\|;:'\",<.>/?";
            let letters = "qwertyuiopasdfghjklzxcvbnm";
            let mask = nums + specialChars + letters;
            keys = keys.filter(key => mask.includes(key));
            let shiftPressed = Input_1.default.isKeyPressed("shift");
            let backspacePressed = Input_1.default.isKeyJustPressed("backspace");
            let spacePressed = Input_1.default.isKeyJustPressed("space");
            if (backspacePressed) {
                this.text = this.text.substring(0, this.text.length - 1);
            }
            else if (spacePressed) {
                this.text += " ";
            }
            else if (keys.length > 0) {
                if (shiftPressed) {
                    this.text += keys[0].toUpperCase();
                }
                else {
                    this.text += keys[0];
                }
            }
        }
    }
}
exports.default = TextInput;
},{"../../Input/Input":31,"../../Utils/Color":104,"./Label":54}],57:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIElementType = void 0;
var UIElementType;
(function (UIElementType) {
    UIElementType["BUTTON"] = "BUTTON";
    UIElementType["LABEL"] = "LABEL";
    UIElementType["SLIDER"] = "SLIDER";
    UIElementType["TEXT_INPUT"] = "TEXTINPUT";
})(UIElementType = exports.UIElementType || (exports.UIElementType = {}));
},{}],58:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
/**
 * The manager class for navigation.
 * Handles all navigable entities, such and allows them to be accessed by outside systems by requesting a path
 * from one position to another.
 */
class NavigationManager {
    constructor() {
        this.navigableEntities = new Map_1.default();
    }
    /**
     * Adds a navigable entity to the NavigationManager
     * @param navName The name of the navigable entitry
     * @param nav The actual Navigable instance
     */
    addNavigableEntity(navName, nav) {
        this.navigableEntities.add(navName, nav);
    }
    /**
     * Gets a path frome one point to another using a specified Navigable object
     * @param navName The name of the registered Navigable object
     * @param fromPosition The starting position of navigation
     * @param toPosition The ending position of Navigation
     * @param direct If true, go direct from fromPosition to toPosition, don't use NavMesh
     * @returns A NavigationPath containing the route to take over the Navigable entity to get between the provided positions.
     */
    getPath(navName, fromPosition, toPosition) {
        let nav = this.navigableEntities.get(navName);
        return nav.getNavigationPath(fromPosition.clone(), toPosition.clone());
    }
}
exports.default = NavigationManager;
},{"../DataTypes/Collections/Map":5}],59:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
/**
 * A path that AIs can follow. Uses finishMove() in Physical to determine progress on the route
 */
class NavigationPath {
    /**
     * Constructs a new NavigationPath
     * @param path The path of nodes to take
     */
    constructor(path) {
        this.path = path;
        this.currentMoveDirection = Vec2_1.default.ZERO;
        this.distanceThreshold = 4;
    }
    /**
     * Returns the status of navigation along this NavigationPath
     * @returns True if the node has reached the end of the path, false otherwise
     */
    isDone() {
        return this.path.isEmpty();
    }
    next() { return this.path.isEmpty() ? null : this.path.peek(); }
    /**
     * Gets the movement direction in the current position along the path
     * @param node The node to move along the path
     * @returns The movement direction as a Vec2
     */
    getMoveDirection(node) {
        // Return direction to next point in the nav
        return node.position.dirTo(this.path.peek());
    }
    /**
     * Updates this NavigationPath to the current state of the GameNode
     * @param node The node moving along the path
     */
    handlePathProgress(node) {
        if (!this.path.isEmpty() && node.position.distanceSqTo(this.path.peek()) < this.distanceThreshold * this.distanceThreshold) {
            // We've reached our node, move on to the next destination
            this.path.pop();
        }
    }
    toString() {
        return this.path.toString();
    }
}
exports.default = NavigationPath;
},{"../DataTypes/Vec2":23}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An implementation of a Navmesh. Navmeshes are graphs in the game world along which nodes can move.
 */
class Navmesh {
    /**
     * Creates a new Navmesh from the points in the speecified graph. Navigation is done using the
     * given NavigationStrategy.
     * @param graph the graph to construct a navmesh from
     * @param strategy a constructor for strategy to use to build paths for this navmesh
     */
    constructor(graph) {
        this._graph = graph;
        this._strategies = new Map();
        this._strategy = undefined;
    }
    get graph() { return this._graph; }
    setStrategy(strategy) { this._strategy = this._strategies.get(strategy); }
    // @implemented
    getNavigationPath(fromPosition, toPosition) {
        if (this._strategy === undefined) {
            throw new Error("Error.No pathfinding strategy set for this navmesh.");
        }
        return this._strategy.buildPath(toPosition, fromPosition);
    }
    registerStrategy(key, strategy) {
        this._strategies.set(key, strategy);
    }
}
exports.default = Navmesh;
},{}],61:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stack_1 = __importDefault(require("../../DataTypes/Collections/Stack"));
const NavigationPath_1 = __importDefault(require("../NavigationPath"));
const NavigationStrategy_1 = __importDefault(require("./NavigationStrategy"));
/**
 * Constructs a navigation path that goes directly from point A to point B. In the
 * original implementation of the NavigationPath, you could set a flag to tell it to
 * create a direct path. I've basically removed that flag and created this class in
 * it's place.
 * @author PeteyLumpkins
 */
class DirectPathStrat extends NavigationStrategy_1.default {
    /**
     * @see NavPathStrat.buildPath()
     */
    buildPath(to, from) {
        let stack = new Stack_1.default();
        stack.push(to.clone());
        return new NavigationPath_1.default(stack);
    }
}
exports.default = DirectPathStrat;
},{"../../DataTypes/Collections/Stack":7,"../NavigationPath":59,"./NavigationStrategy":62}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * An abstract navigation strategy for Wolfie2Ds navigation system. You can extend this class to create
 * your own strategy for constructing a NavigationPath for the navigation system.
 * @author PeteyLumpkins
 */
class NavigationStrategy {
    constructor(mesh) {
        this.mesh = mesh;
    }
    get mesh() { return this._mesh; }
    set mesh(mesh) { this._mesh = mesh; }
}
exports.default = NavigationStrategy;
},{}],63:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PhysicsManager_1 = __importDefault(require("./PhysicsManager"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const OrthogonalTilemap_1 = __importDefault(require("../Nodes/Tilemaps/OrthogonalTilemap"));
const AreaCollision_1 = __importDefault(require("../DataTypes/Physics/AreaCollision"));
/**
 * ALGORITHM:
 * 	In an effort to keep things simple and working effectively, each dynamic node will resolve its
 * 	collisions considering the rest of the world as static.
 *
 * 	Collision detecting will happen first. This can be considered a broad phase, but it is not especially
 * 	efficient, as it does not need to be for this game engine. Every dynamic node is checked against every
 * 	other node for collision area. If collision area is non-zero (meaning the current node sweeps into another),
 * 	it is added to a list of hits.
 *
 * 	INITIALIZATION:
 * 		- Physics constants are reset
 * 		- Swept shapes are recalculated. If a node isn't moving, it is skipped.
 *
 * 	COLLISION DETECTION:
 * 		- For a node, collision area will be calculated using the swept AABB of the node against every other AABB in a static state
 * 		- These collisions will be sorted by area in descending order
 *
 * 	COLLISION RESOLUTION:
 * 		- For each hit, time of collision is calculated using a swept line through the AABB of the static node expanded
 * 			with minkowski sums (discretely, but the concept is there)
 * 		- The collision is resolved based on the near time of the collision (from method of separated axes)
 * 			- X is resolved by near x, Y by near y.
 * 			- There is some fudging to allow for sliding along walls of separate colliders. Sorting by area also helps with this.
 * 			- Corner to corner collisions are resolve to favor x-movement. This is in consideration of platformers, to give
 * 				the player some help with jumps
 *
 * 	Pros:
 * 		- Everything happens with a consistent time. There is a distinct before and after for each resolution.
 * 		- No back-tracking needs to be done. Once we resolve a node, it is definitively resolved.
 *
 * 	Cons:
 * 		- Nodes that are processed early have movement priority over other nodes. This can lead to some undesirable interactions.
 */
class BasicPhysicsManager extends PhysicsManager_1.default {
    constructor(options) {
        super();
        this.staticNodes = new Array();
        this.dynamicNodes = new Array();
        this.tilemaps = new Array();
        this.collisionMasks = new Array(32);
        // Parse options
        this.parseOptions(options);
    }
    /**
     * Parses the options for constructing the physics manager
     * @param options A record of options
     */
    parseOptions(options) {
        if (options.groupNames !== undefined && options.collisions !== undefined) {
            for (let i = 0; i < options.groupNames.length; i++) {
                let group = options.groupNames[i];
                // Register the group name and number
                this.groupNames[i] = group;
                this.groupMap.set(group, 1 << i);
                let collisionMask = 0;
                for (let j = 0; j < options.collisions[i].length; j++) {
                    if (options.collisions[i][j]) {
                        collisionMask |= 1 << j;
                    }
                }
                this.collisionMasks[i] = collisionMask;
            }
        }
    }
    // @override
    registerObject(node) {
        if (node.isStatic) {
            // Static and not collidable
            this.staticNodes.push(node);
        }
        else {
            // Dynamic and not collidable
            this.dynamicNodes.push(node);
        }
    }
    // @override
    deregisterObject(node) {
        if (node.isStatic) {
            // Remove the node from the static list
            const index = this.staticNodes.indexOf(node);
            this.staticNodes.splice(index, 1);
        }
        else {
            // Remove the node from the dynamic list
            const index = this.dynamicNodes.indexOf(node);
            this.dynamicNodes.splice(index, 1);
        }
    }
    // @override
    registerTilemap(tilemap) {
        this.tilemaps.push(tilemap);
    }
    // @override
    deregisterTilemap(tilemap) {
        const index = this.tilemaps.indexOf(tilemap);
        this.tilemaps.splice(index, 1);
    }
    // @override
    update(deltaT) {
        for (let node of this.dynamicNodes) {
            /*---------- INITIALIZATION PHASE ----------*/
            // Clear frame dependent boolean values for each node
            node.onGround = false;
            node.onCeiling = false;
            node.onWall = false;
            node.collidedWithTilemap = false;
            node.isColliding = false;
            // If this node is not active, don't process it
            if (!node.active) {
                continue;
            }
            // Update the swept shapes of each node
            if (node.moving) {
                // If moving, reflect that in the swept shape
                node.sweptRect.sweep(node._velocity, node.collisionShape.center, node.collisionShape.halfSize);
            }
            else {
                // If our node isn't moving, don't bother to check it (other nodes will detect if they run into it)
                node._velocity.zero();
                continue;
            }
            /*---------- DETECTION PHASE ----------*/
            // Gather a set of overlaps
            let overlaps = new Array();
            let groupIndex = node.group === -1 ? -1 : Math.log2(node.group);
            // First, check this node against every static node (order doesn't actually matter here, since we sort anyways)
            for (let other of this.staticNodes) {
                // Ignore inactive nodes
                if (!other.active)
                    continue;
                let collider = other.collisionShape.getBoundingRect();
                let area = node.sweptRect.overlapArea(collider);
                if (area > 0) {
                    // We had a collision
                    overlaps.push(new AreaCollision_1.default(area, collider, other, "GameNode", null));
                }
            }
            // Then, check it against every dynamic node
            for (let other of this.dynamicNodes) {
                // Ignore ourselves
                if (node === other)
                    continue;
                // Ignore inactive nodes
                if (!other.active)
                    continue;
                let collider = other.collisionShape.getBoundingRect();
                let area = node.sweptRect.overlapArea(collider);
                if (area > 0) {
                    // We had a collision
                    overlaps.push(new AreaCollision_1.default(area, collider, other, "GameNode", null));
                }
            }
            // Lastly, gather a set of AABBs from the tilemap.
            // This step involves the most extra work, so it is abstracted into a method
            for (let tilemap of this.tilemaps) {
                // Ignore inactive tilemaps
                if (!tilemap.active)
                    continue;
                if (tilemap instanceof OrthogonalTilemap_1.default) {
                    this.collideWithOrthogonalTilemap(node, tilemap, overlaps);
                }
            }
            // Sort the overlaps by area
            overlaps = overlaps.sort((a, b) => b.area - a.area);
            // Keep track of hits to use later
            let hits = [];
            /*---------- RESOLUTION PHASE ----------*/
            // For every overlap, determine if we need to collide with it and when
            for (let overlap of overlaps) {
                // Ignore nodes we don't interact with
                if (groupIndex !== -1 && overlap.other.group !== -1 && ((this.collisionMasks[groupIndex] & overlap.other.group) === 0))
                    continue;
                // Do a swept line test on the static AABB with this AABB size as padding (this is basically using a minkowski sum!)
                // Start the sweep at the position of this node with a delta of _velocity
                const point = node.collisionShape.center;
                const delta = node._velocity;
                const padding = node.collisionShape.halfSize;
                const otherAABB = overlap.collider;
                const hit = otherAABB.intersectSegment(node.collisionShape.center, node._velocity, node.collisionShape.halfSize);
                overlap.hit = hit;
                if (hit !== null) {
                    hits.push(hit);
                    // We got a hit, resolve with the time inside of the hit
                    let tnearx = hit.nearTimes.x;
                    let tneary = hit.nearTimes.y;
                    // Allow edge clipping (edge overlaps don't count, only area overlaps)
                    // Importantly don't allow both cases to be true. Then we clip through corners. Favor x to help players land jumps
                    if (tnearx < 1.0 && (point.y === otherAABB.top - padding.y || point.y === otherAABB.bottom + padding.y) && delta.x !== 0) {
                        tnearx = 1.0;
                    }
                    else if (tneary < 1.0 && (point.x === otherAABB.left - padding.x || point.x === otherAABB.right + padding.x) && delta.y !== 0) {
                        tneary = 1.0;
                    }
                    if (hit.nearTimes.x >= 0 && hit.nearTimes.x < 1) {
                        // Any tilemap objects that made it here are collidable
                        if (overlap.type === "Tilemap" || overlap.other.isCollidable) {
                            node._velocity.x = node._velocity.x * tnearx;
                            node.isColliding = true;
                        }
                    }
                    if (hit.nearTimes.y >= 0 && hit.nearTimes.y < 1) {
                        // Any tilemap objects that made it here are collidable
                        if (overlap.type === "Tilemap" || overlap.other.isCollidable) {
                            node._velocity.y = node._velocity.y * tneary;
                            node.isColliding = true;
                        }
                    }
                }
            }
            /*---------- INFORMATION/TRIGGER PHASE ----------*/
            // Check if we ended up on the ground, ceiling or wall
            // Also check for triggers
            for (let overlap of overlaps) {
                // Check for a trigger. If we care about the trigger, react
                if (overlap.other.isTrigger && (overlap.other.triggerMask & node.group) && node.group != -1) {
                    // Get the bit that this group is represented by
                    let index = Math.floor(Math.log2(node.group));
                    // Extract the triggerEnter event name
                    this.emitter.fireEvent(overlap.other.triggerEnters[index], {
                        node: node.id,
                        other: overlap.other.id
                    });
                }
                // Ignore collision sides for nodes we don't interact with
                if (groupIndex !== -1 && overlap.other.group !== -1 && ((this.collisionMasks[groupIndex] & overlap.other.group) === 0))
                    continue;
                // Only check for direction if the overlap was collidable
                if (overlap.type === "Tilemap" || overlap.other.isCollidable) {
                    let collisionSide = overlap.collider.touchesAABBWithoutCorners(node.collisionShape.getBoundingRect());
                    if (collisionSide !== null) {
                        // If we touch, not including corner cases, check the collision normal
                        if (overlap.hit !== null) {
                            // If we hit a tilemap, keep track of it
                            if (overlap.type == "Tilemap") {
                                node.collidedWithTilemap = true;
                            }
                            if (collisionSide.y === -1) {
                                // Node is on top of overlap, so onGround
                                node.onGround = true;
                            }
                            else if (collisionSide.y === 1) {
                                // Node is on bottom of overlap, so onCeiling
                                node.onCeiling = true;
                            }
                            else {
                                // Node wasn't touching on y, so it is touching on x
                                node.onWall = true;
                            }
                        }
                    }
                }
            }
            // Resolve the collision with the node, and move it
            node.finishMove();
        }
    }
    /**
     * Handles a collision between this node and an orthogonal tilemap
     * @param node The node
     * @param tilemap The tilemap the node may be colliding with
     * @param overlaps The list of overlaps
     */
    collideWithOrthogonalTilemap(node, tilemap, overlaps) {
        // Get the min and max x and y coordinates of the moving node
        let min = new Vec2_1.default(node.sweptRect.left, node.sweptRect.top);
        let max = new Vec2_1.default(node.sweptRect.right, node.sweptRect.bottom);
        // Convert the min/max x/y to the min and max row/col in the tilemap array
        let minIndex = tilemap.getMinColRow(node.sweptRect);
        let maxIndex = tilemap.getMaxColRow(node.sweptRect);
        // Loop over all possible tiles (which isn't many in the scope of the velocity per frame)
        for (let col = minIndex.x; col <= maxIndex.x; col++) {
            for (let row = minIndex.y; row <= maxIndex.y; row++) {
                if (tilemap.isTileCollidable(col, row)) {
                    // Create a new collider for this tile
                    let collider = tilemap.getTileCollider(col, row);
                    // Calculate collision area between the node and the tile
                    let area = node.sweptRect.overlapArea(collider);
                    if (area > 0) {
                        // We had a collision
                        overlaps.push(new AreaCollision_1.default(area, collider, tilemap, "Tilemap", new Vec2_1.default(col, row)));
                    }
                }
            }
        }
    }
}
exports.default = BasicPhysicsManager;
},{"../DataTypes/Physics/AreaCollision":14,"../DataTypes/Vec2":23,"../Nodes/Tilemaps/OrthogonalTilemap":50,"./PhysicsManager":64}],64:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const Emitter_1 = __importDefault(require("../Events/Emitter"));
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
/**
 * An abstract physics manager.
 * This class exposes functions for subclasses to implement that should allow for a working physics system to be created.
 */
class PhysicsManager {
    constructor() {
        this.receiver = new Receiver_1.default();
        this.emitter = new Emitter_1.default();
        // The creation and implementation of layers is deferred to the subclass
        this.groupMap = new Map_1.default();
        this.groupNames = new Array();
    }
    destroy() {
        this.receiver.destroy();
    }
    /**
     * Sets the physics layer of the GameNode
     * @param node The GameNode
     * @param group The group that the GameNode should be on
     */
    setGroup(node, group) {
        node.group = this.groupMap.get(group);
    }
    /**
     * Retrieves the layer number associated with the provided name
     * @param layer The name of the layer
     * @returns The layer number, or 0 if there is not a layer with that name registered
     */
    getGroupNumber(group) {
        if (this.groupMap.has(group)) {
            return this.groupMap.get(group);
        }
        else {
            return 0;
        }
    }
    /**
     * Gets all group names associated with the number provided
     * @param groups A mask of groups
     * @returns All groups contained in the mask
     */
    getGroupNames(groups) {
        if (groups === -1) {
            return [PhysicsManager.DEFAULT_GROUP];
        }
        else {
            let g = 1;
            let names = [];
            for (let i = 0; i < 32; i++) {
                if (g & groups) {
                    // This group is in the groups number
                    names.push(this.groupNames[i]);
                }
                // Shift the bit over
                g = g << 1;
            }
        }
    }
}
exports.default = PhysicsManager;
/** The default group name */
PhysicsManager.DEFAULT_GROUP = "Default";
},{"../DataTypes/Collections/Map":5,"../Events/Emitter":26,"../Events/Receiver":30}],65:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GameEventType_1 = require("../Events/GameEventType");
const Receiver_1 = __importDefault(require("../Events/Receiver"));
class PlaybackManager {
    constructor() {
        this.recording = false;
        this.playing = false;
        this.receiver = new Receiver_1.default();
        this.receiver.subscribe([GameEventType_1.GameEventType.START_RECORDING, GameEventType_1.GameEventType.STOP_RECORDING, GameEventType_1.GameEventType.PLAY_RECORDING]);
    }
    update(deltaT) {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
        if (this.recorder !== undefined) {
            this.recorder.update(deltaT);
            this.recording = this.recorder.active();
        }
        if (this.replayer !== undefined) {
            this.replayer.update(deltaT);
            this.playing = this.replayer.active();
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case GameEventType_1.GameEventType.START_RECORDING: {
                this.handleStartRecordingEvent(event);
                break;
            }
            case GameEventType_1.GameEventType.STOP_RECORDING: {
                this.handleStopRecordingEvent();
                break;
            }
            case GameEventType_1.GameEventType.PLAY_RECORDING: {
                this.handlePlayRecordingEvent(event);
                break;
            }
        }
    }
    handleStartRecordingEvent(event) {
        let recording = event.data.get("recording");
        if (!this.playing && !this.recording && recording !== undefined) {
            this.lastRecording = recording;
            let Recorder = this.lastRecording.recorder();
            if (this.recorder === undefined || this.recorder.constructor !== Recorder) {
                this.recorder = new Recorder();
            }
            this.recorder.start(this.lastRecording);
            this.recording = this.recorder.active();
        }
    }
    handleStopRecordingEvent() {
        this.recorder.stop();
        this.recording = this.recorder.active();
    }
    handlePlayRecordingEvent(event) {
        if (!this.recording && this.lastRecording !== undefined) {
            let Replayer = this.lastRecording.replayer();
            if (this.replayer === undefined || this.replayer.constructor !== Replayer) {
                this.replayer = new Replayer();
            }
            this.replayer.start(this.lastRecording, event.data.get("onEnd"));
            this.playing = this.replayer.active();
        }
    }
}
exports.default = PlaybackManager;
},{"../Events/GameEventType":29,"../Events/Receiver":30}],66:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../../DataTypes/Collections/Map"));
/** */
class Registry extends Map_1.default {
}
exports.default = Registry;
},{"../../DataTypes/Collections/Map":5}],67:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LabelShaderType_1 = __importDefault(require("../../Rendering/WebGLRendering/ShaderTypes/LabelShaderType"));
const PointShaderType_1 = __importDefault(require("../../Rendering/WebGLRendering/ShaderTypes/PointShaderType"));
const RectShaderType_1 = __importDefault(require("../../Rendering/WebGLRendering/ShaderTypes/RectShaderType"));
const SpriteShaderType_1 = __importDefault(require("../../Rendering/WebGLRendering/ShaderTypes/SpriteShaderType"));
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const Registry_1 = __importDefault(require("./Registry"));
/**
 * A registry that handles shaders
 */
class ShaderRegistry extends Registry_1.default {
    constructor() {
        super(...arguments);
        this.registryItems = new Array();
    }
    /**
     * Preloads all built-in shaders
     */
    preload() {
        // Get the resourceManager and queue all built-in shaders for preloading
        const rm = ResourceManager_1.default.getInstance();
        // Queue a load for the point shader
        this.registerAndPreloadItem(ShaderRegistry.POINT_SHADER, PointShaderType_1.default, "builtin/shaders/point.vshader", "builtin/shaders/point.fshader");
        // Queue a load for the rect shader
        this.registerAndPreloadItem(ShaderRegistry.RECT_SHADER, RectShaderType_1.default, "builtin/shaders/rect.vshader", "builtin/shaders/rect.fshader");
        // Queue a load for the sprite shader
        this.registerAndPreloadItem(ShaderRegistry.SPRITE_SHADER, SpriteShaderType_1.default, "builtin/shaders/sprite.vshader", "builtin/shaders/sprite.fshader");
        // Queue a load for the label shader
        this.registerAndPreloadItem(ShaderRegistry.LABEL_SHADER, LabelShaderType_1.default, "builtin/shaders/label.vshader", "builtin/shaders/label.fshader");
        // Queue a load for any preloaded items
        for (let item of this.registryItems) {
            const shader = new item.constr(item.key);
            shader.initBufferObject();
            this.add(item.key, shader);
            // Load if desired
            if (item.preload !== undefined) {
                rm.shader(item.key, item.preload.vshaderLocation, item.preload.fshaderLocation);
            }
        }
    }
    /**
     * Registers a shader in the registry and loads it before the game begins
     * @param key The key you wish to assign to the shader
     * @param constr The constructor of the ShaderType
     * @param vshaderLocation The location of the vertex shader
     * @param fshaderLocation the location of the fragment shader
     */
    registerAndPreloadItem(key, constr, vshaderLocation, fshaderLocation) {
        let shaderPreload = new ShaderPreload();
        shaderPreload.vshaderLocation = vshaderLocation;
        shaderPreload.fshaderLocation = fshaderLocation;
        let registryItem = new ShaderRegistryItem();
        registryItem.key = key;
        registryItem.constr = constr;
        registryItem.preload = shaderPreload;
        this.registryItems.push(registryItem);
    }
    /**
     * Registers a shader in the registry. NOTE: If you use this, you MUST load the shader before use.
     * If you wish to preload the shader, use registerAndPreloadItem()
     * @param key The key you wish to assign to the shader
     * @param constr The constructor of the ShaderType
     */
    registerItem(key, constr) {
        let registryItem = new ShaderRegistryItem();
        registryItem.key = key;
        registryItem.constr = constr;
        this.registryItems.push(registryItem);
    }
}
exports.default = ShaderRegistry;
// Shader names
ShaderRegistry.POINT_SHADER = "point";
ShaderRegistry.RECT_SHADER = "rect";
ShaderRegistry.SPRITE_SHADER = "sprite";
ShaderRegistry.LABEL_SHADER = "label";
class ShaderRegistryItem {
}
class ShaderPreload {
}
},{"../../Rendering/WebGLRendering/ShaderTypes/LabelShaderType":82,"../../Rendering/WebGLRendering/ShaderTypes/PointShaderType":83,"../../Rendering/WebGLRendering/ShaderTypes/RectShaderType":85,"../../Rendering/WebGLRendering/ShaderTypes/SpriteShaderType":87,"../../ResourceManager/ResourceManager":88,"./Registry":66}],68:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const ShaderRegistry_1 = __importDefault(require("./Registries/ShaderRegistry"));
/**
 * The Registry is the system's way of converting classes and types into string
 * representations for use elsewhere in the application.
 * It allows classes to be accessed without explicitly using constructors in code,
 * and for resources to be loaded at Game creation time.
 */
class RegistryManager {
    static preload() {
        this.shaders.preload();
        this.registries.forEach((key) => this.registries.get(key).preload());
    }
    static addCustomRegistry(name, registry) {
        this.registries.add(name, registry);
    }
    static getRegistry(key) {
        return this.registries.get(key);
    }
}
exports.default = RegistryManager;
RegistryManager.shaders = new ShaderRegistry_1.default();
/** Additional custom registries to add to the registry manager */
RegistryManager.registries = new Map_1.default();
},{"../DataTypes/Collections/Map":5,"./Registries/ShaderRegistry":67}],69:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../../DataTypes/Collections/Map"));
const Emitter_1 = __importDefault(require("../../Events/Emitter"));
const AnimationTypes_1 = require("./AnimationTypes");
/**
 * An animation manager class for an animated CanvasNode.
 * This class keeps track of the possible animations, as well as the current animation state,
 * and abstracts all interactions with playing, pausing, and stopping animations as well as
 * creating new animations from the CanvasNode.
 */
class AnimationManager {
    /**
     * Creates a new AnimationManager
     * @param owner The owner of the AnimationManager
     */
    constructor(owner) {
        this.owner = owner;
        this.animationState = AnimationTypes_1.AnimationState.STOPPED;
        this.currentAnimation = "";
        this.currentFrame = 0;
        this.frameProgress = 0;
        this.loop = false;
        this.animations = new Map_1.default();
        this.onEndEvent = null;
        this.emitter = new Emitter_1.default();
    }
    /**
     * Add an animation to this sprite
     * @param key The unique key of the animation
     * @param animation The animation data
     */
    add(key, animation) {
        this.animations.add(key, animation);
    }
    /**
     * Gets the index specified by the current animation and current frame
     * @returns The index in the current animation
     */
    getIndex() {
        if (this.animations.has(this.currentAnimation)) {
            return this.animations.get(this.currentAnimation).frames[this.currentFrame].index;
        }
        else {
            // No current animation, warn the user
            console.warn(`Animation index was requested, but the current animation: ${this.currentAnimation} was invalid`);
            return 0;
        }
    }
    /**
     * Determines whether the specified animation is currently playing
     * @param key The key of the animation to check
     * @returns true if the specified animation is playing, false otherwise
     */
    isPlaying(key) {
        return this.currentAnimation === key && this.animationState === AnimationTypes_1.AnimationState.PLAYING;
    }
    /**
     * Retrieves the current animation index and advances the animation frame
     * @returns The index of the animation frame
     */
    getIndexAndAdvanceAnimation() {
        // If we aren't playing, we won't be advancing the animation
        if (!(this.animationState === AnimationTypes_1.AnimationState.PLAYING)) {
            return this.getIndex();
        }
        if (this.animations.has(this.currentAnimation)) {
            let currentAnimation = this.animations.get(this.currentAnimation);
            let index = currentAnimation.frames[this.currentFrame].index;
            // Advance the animation
            this.frameProgress += 1;
            if (this.frameProgress >= currentAnimation.frames[this.currentFrame].duration) {
                // We have been on this frame for its whole duration, go to the next one
                this.frameProgress = 0;
                this.currentFrame += 1;
                if (this.currentFrame >= currentAnimation.frames.length) {
                    // We have reached the end of this animation
                    if (this.loop) {
                        this.currentFrame = 0;
                        this.frameProgress = 0;
                    }
                    else {
                        this.endCurrentAnimation();
                    }
                }
            }
            // Return the current index
            return index;
        }
        else {
            // No current animation, can't advance. Warn the user
            console.warn(`Animation index and advance was requested, but the current animation (${this.currentAnimation}) in node with id: ${this.owner.id} was invalid`);
            return 0;
        }
    }
    /** Ends the current animation and fires any necessary events, as well as starting any new animations */
    endCurrentAnimation() {
        this.currentFrame = 0;
        this.animationState = AnimationTypes_1.AnimationState.STOPPED;
        if (this.onEndEvent !== null) {
            this.emitter.fireEvent(this.onEndEvent, { owner: this.owner.id, animation: this.currentAnimation });
        }
        // If there is a pending animation, play it
        if (this.pendingAnimation !== null) {
            this.play(this.pendingAnimation, this.pendingLoop, this.pendingOnEnd);
        }
    }
    /**
     * Plays the specified animation. Does not restart it if it is already playing
     * @param animation The name of the animation to play
     * @param loop Whether or not to loop the animation. False by default
     * @param onEnd The name of an event to send when this animation naturally stops playing. This only matters if loop is false.
     */
    playIfNotAlready(animation, loop, onEnd) {
        if (this.currentAnimation !== animation) {
            this.play(animation, loop, onEnd);
        }
    }
    /**
     * Plays the specified animation
     * @param animation The name of the animation to play
     * @param loop Whether or not to loop the animation. False by default
     * @param onEnd The name of an event to send when this animation naturally stops playing. This only matters if loop is false.
     */
    play(animation, loop, onEnd) {
        this.currentAnimation = animation;
        this.currentFrame = 0;
        this.frameProgress = 0;
        this.animationState = AnimationTypes_1.AnimationState.PLAYING;
        // If loop arg was provided, use that
        if (loop !== undefined) {
            this.loop = loop;
        }
        else {
            // Otherwise, use what the json file specified
            this.loop = this.animations.get(animation).repeat;
        }
        if (onEnd !== undefined) {
            this.onEndEvent = onEnd;
        }
        else {
            this.onEndEvent = null;
        }
        // Reset pending animation
        this.pendingAnimation = null;
    }
    /**
     * Queues a single animation to be played after the current one. Does NOT stack.
     * Queueing additional animations past 1 will just replace the queued animation
     * @param animation The animation to queue
     * @param loop Whether or not the loop the queued animation
     * @param onEnd The event to fire when the queued animation ends
     */
    queue(animation, loop = false, onEnd) {
        this.pendingAnimation = animation;
        this.pendingLoop = loop;
        if (onEnd !== undefined) {
            this.pendingOnEnd = onEnd;
        }
        else {
            this.pendingOnEnd = null;
        }
    }
    /** Pauses the current animation */
    pause() {
        this.animationState = AnimationTypes_1.AnimationState.PAUSED;
    }
    /** Resumes the current animation if possible */
    resume() {
        if (this.animationState === AnimationTypes_1.AnimationState.PAUSED) {
            this.animationState = AnimationTypes_1.AnimationState.PLAYING;
        }
    }
    /** Stops the current animation. The animation cannot be resumed after this. */
    stop() {
        this.animationState = AnimationTypes_1.AnimationState.STOPPED;
    }
}
exports.default = AnimationManager;
},{"../../DataTypes/Collections/Map":5,"../../Events/Emitter":26,"./AnimationTypes":70}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TweenData = exports.TweenEffect = exports.AnimationData = exports.AnimationState = void 0;
// @ignorePage
var AnimationState;
(function (AnimationState) {
    AnimationState[AnimationState["STOPPED"] = 0] = "STOPPED";
    AnimationState[AnimationState["PAUSED"] = 1] = "PAUSED";
    AnimationState[AnimationState["PLAYING"] = 2] = "PLAYING";
})(AnimationState = exports.AnimationState || (exports.AnimationState = {}));
class AnimationData {
    constructor() {
        this.repeat = false;
    }
}
exports.AnimationData = AnimationData;
class TweenEffect {
}
exports.TweenEffect = TweenEffect;
class TweenData {
}
exports.TweenData = TweenData;
},{}],71:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const GraphicTypes_1 = require("../../Nodes/Graphics/GraphicTypes");
const Timer_1 = __importDefault(require("../../Timing/Timer"));
const Color_1 = __importDefault(require("../../Utils/Color"));
const MathUtils_1 = __importDefault(require("../../Utils/MathUtils"));
const RandUtils_1 = __importDefault(require("../../Utils/RandUtils"));
const ParticleSystemManager_1 = __importDefault(require("./ParticleSystemManager"));
class ParticleSystem {
    /**
     * Construct a particle system
     *
     * @param poolSize The pool size, i.e the total number of particles that will be created
     * @param sourcePoint The initial source point each particle will start at when the system is running, can be changed
     * @param lifetime Lifetime of each particle before they are set inactive
     * @param size Size of each particle
     * @param mass Initial mass of each particle, can be changed
     * @param maxParticlesPerFrame Total number of particles that can be created during a given frame.
     */
    constructor(poolSize, sourcePoint, lifetime, size, mass, maxParticlesPerFrame) {
        this.color = new Color_1.default(255, 0, 0);
        this.particlePool = new Array(poolSize);
        this.sourcePoint = sourcePoint;
        this.lifetime = lifetime;
        this.particleSize = new Vec2_1.default(size, size);
        this.systemRunning = false;
        this.particlesPerFrame = maxParticlesPerFrame;
        this.particlesToRender = this.particlesPerFrame;
        this.particleMass = mass;
        ParticleSystemManager_1.default.getInstance().registerParticleSystem(this);
    }
    /** Initialize the pool of all particles, creating the assets in advance */
    initializePool(scene, layer) {
        for (let i = 0; i < this.particlePool.length; i++) {
            this.particlePool[i] = scene.add.graphic(GraphicTypes_1.GraphicType.PARTICLE, layer, { position: this.sourcePoint.clone(), size: this.particleSize.clone(), mass: this.particleMass });
            this.particlePool[i].addPhysics();
            this.particlePool[i].isCollidable = false;
            this.particlePool[i].visible = false;
        }
    }
    /**
     * Start up the particle system to run for a set amount of time
     * @param time Time for the particle systme to run
     * @param mass Optional change of mass for each particle
     * @param startPoint Optional change of start position for each particle
     */
    startSystem(time, mass, startPoint) {
        //Stop the system to reset all particles
        this.stopSystem();
        //Set the timer
        this.systemLifetime = new Timer_1.default(time);
        //Update optional parameters
        if (mass !== undefined)
            this.particleMass = mass;
        if (startPoint !== undefined)
            this.sourcePoint = startPoint;
        //Start the timer, set flags, and give the initial amount of particles to render
        this.systemLifetime.start();
        this.systemRunning = true;
        this.particlesToRender = this.particlesPerFrame;
    }
    stopSystem() {
        this.systemRunning = false;
        for (let particle of this.particlePool) {
            if (particle.inUse) {
                particle.setParticleInactive();
            }
        }
    }
    changeColor(color) {
        this.color = color;
    }
    /**
     * Default implementation of setParticleAnimation, no tween animations occur, but each particle is given a random
     * velocity. It's encouraged for you to override this function and implement your own tween animations.
     *
     * @param particle
     */
    setParticleAnimation(particle) {
        particle.vel = RandUtils_1.default.randVec(-50, 50, -100, 100);
        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: []
        });
    }
    update(deltaT) {
        // Exit if the system isn't currently running
        if (!this.systemRunning) {
            return;
        }
        // Stop the system if our timer is up
        if (this.systemLifetime.isStopped()) {
            this.stopSystem();
        }
        else {
            for (let i = 0; i < this.particlesToRender; i++) {
                let particle = this.particlePool[i];
                // If a particle is in use, decrease it's age and update it's velocity, if it has one
                if (particle.inUse) {
                    particle.decrementAge(deltaT * 1000);
                    if (particle.age <= 0) {
                        particle.setParticleInactive();
                    }
                    particle.move(particle.vel.scaled(deltaT));
                }
                else {
                    // Set the particle to active
                    particle.setParticleActive(this.lifetime, this.sourcePoint.clone());
                    // Update particle color, mass, and alpha
                    particle.color = this.color;
                    particle.alpha = 1;
                    particle.mass = this.particleMass;
                    // Give particle tween animations
                    this.setParticleAnimation(particle);
                    particle.tweens.play("active");
                }
            }
            // Update the amount of particles that can be rendered based on the particles per frame, clamping if we go over the total number
            // of particles in our pool
            this.particlesToRender = MathUtils_1.default.clamp(this.particlesToRender + this.particlesPerFrame, 0, this.particlePool.length);
        }
    }
}
exports.default = ParticleSystem;
},{"../../DataTypes/Vec2":23,"../../Nodes/Graphics/GraphicTypes":41,"../../Timing/Timer":102,"../../Utils/Color":104,"../../Utils/MathUtils":107,"../../Utils/RandUtils":108,"./ParticleSystemManager":72}],72:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ParticleSystemManager {
    constructor() {
        this.particleSystems = new Array();
    }
    static getInstance() {
        if (ParticleSystemManager.instance === null) {
            ParticleSystemManager.instance = new ParticleSystemManager();
        }
        return ParticleSystemManager.instance;
    }
    registerParticleSystem(system) {
        this.particleSystems.push(system);
    }
    deregisterParticleSystem(system) {
        let index = this.particleSystems.indexOf(system);
        this.particleSystems.splice(index, 1);
    }
    clearParticleSystems() {
        this.particleSystems = new Array();
    }
    update(deltaT) {
        for (let particleSystem of this.particleSystems) {
            particleSystem.update(deltaT);
        }
    }
}
exports.default = ParticleSystemManager;
ParticleSystemManager.instance = null;
},{}],73:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../../DataTypes/Collections/Map"));
const AnimationTypes_1 = require("./AnimationTypes");
const EaseFunctions_1 = __importDefault(require("../../Utils/EaseFunctions"));
const MathUtils_1 = __importDefault(require("../../Utils/MathUtils"));
const TweenManager_1 = __importDefault(require("./TweenManager"));
const Emitter_1 = __importDefault(require("../../Events/Emitter"));
/**
 * A manager for the tweens of a GameNode.
 * Tweens are short animations played by interpolating between two properties using an easing function.
 * For a good visual representation of easing functions, check out @link(https://easings.net/)(https://easings.net/).
 * Multiple tween can be played at the same time, as long as they don't change the same property.
 * This allows for some interesting polishes or animations that may be very difficult to do with sprite work alone
 * - especially pixel art (such as rotations or scaling).
 */
class TweenController {
    /**
     * Creates a new TweenController
     * @param owner The owner of the TweenController
     */
    constructor(owner) {
        this.owner = owner;
        this.tweens = new Map_1.default();
        this.emitter = new Emitter_1.default();
        // Give ourselves to the TweenManager
        TweenManager_1.default.getInstance().registerTweenController(this);
    }
    /**
     * Destroys this TweenController
     */
    destroy() {
        // Only the gamenode and the tween manager should have a reference to this
        delete this.owner.tweens;
        TweenManager_1.default.getInstance().deregisterTweenController(this);
    }
    /**
     * Add a tween to this game node
     * @param key The name of the tween
     * @param tween The data of the tween
     */
    add(key, tween) {
        let typedTween = tween;
        // Initialize members that we need (and the user didn't provide)
        typedTween.progress = 0;
        typedTween.elapsedTime = 0;
        typedTween.animationState = AnimationTypes_1.AnimationState.STOPPED;
        this.tweens.add(key, typedTween);
    }
    /**
     * Play a tween with a certain name
     * @param key The name of the tween to play
     * @param loop Whether or not the tween should loop
     */
    play(key, loop) {
        if (this.tweens.has(key)) {
            let tween = this.tweens.get(key);
            // Set loop if needed
            if (loop !== undefined) {
                tween.loop = loop;
            }
            // Set the initial values
            for (let effect of tween.effects) {
                if (effect.resetOnComplete) {
                    effect.initialValue = this.owner[effect.property];
                }
            }
            // Start the tween running
            tween.animationState = AnimationTypes_1.AnimationState.PLAYING;
            tween.elapsedTime = 0;
            tween.progress = 0;
            tween.reversing = false;
        }
        else {
            console.warn(`Tried to play tween "${key}" on node with id ${this.owner.id}, but no such tween exists`);
        }
    }
    /**
     * Pauses a playing tween. Does not affect tweens that are stopped.
     * @param key The name of the tween to pause.
     */
    pause(key) {
        if (this.tweens.has(key)) {
            this.tweens.get(key).animationState = AnimationTypes_1.AnimationState.PAUSED;
        }
    }
    /**
     * Resumes a paused tween.
     * @param key The name of the tween to resume
     */
    resume(key) {
        if (this.tweens.has(key)) {
            let tween = this.tweens.get(key);
            if (tween.animationState === AnimationTypes_1.AnimationState.PAUSED)
                tween.animationState = AnimationTypes_1.AnimationState.PLAYING;
        }
    }
    /**
     * Stops a currently playing tween
     * @param key The key of the tween
     */
    stop(key) {
        if (this.tweens.has(key)) {
            let tween = this.tweens.get(key);
            tween.animationState = AnimationTypes_1.AnimationState.STOPPED;
            // Return to the initial values
            for (let effect of tween.effects) {
                if (effect.resetOnComplete) {
                    this.owner[effect.property] = effect.initialValue;
                }
            }
        }
    }
    /**
     * The natural stop of a currently playing tween
     * @param key The key of the tween
     */
    end(key) {
        this.stop(key);
        if (this.tweens.has(key)) {
            // Get the tween
            let tween = this.tweens.get(key);
            // If it has an onEnd, send an event
            if (tween.onEnd) {
                let data = { key: key, node: this.owner.id };
                // If it has onEnd event data, add each entry, as long as the key is not named 'key' or 'node'
                if (tween.onEndData) {
                    Object.keys(tween.onEndData).forEach(key => {
                        if (key !== "key" && key !== "node") {
                            data[key] = tween.onEndData[key];
                        }
                    });
                }
                this.emitter.fireEvent(tween.onEnd, data);
            }
        }
    }
    /**
     * Stops all currently playing tweens
     */
    stopAll() {
        this.tweens.forEach(key => this.stop(key));
    }
    update(deltaT) {
        this.tweens.forEach(key => {
            let tween = this.tweens.get(key);
            if (tween.animationState === AnimationTypes_1.AnimationState.PLAYING) {
                // Update the progress of the tween
                tween.elapsedTime += deltaT * 1000;
                // If we're past the startDelay, do the tween
                if (tween.elapsedTime >= tween.startDelay) {
                    if (!tween.reversing && tween.elapsedTime >= tween.startDelay + tween.duration) {
                        // If we're over time, stop the tween, loop, or reverse
                        if (tween.reverseOnComplete) {
                            // If we're over time and can reverse, do so
                            tween.reversing = true;
                        }
                        else if (tween.loop) {
                            // If we can't reverse and can loop, do so
                            tween.elapsedTime -= tween.duration;
                        }
                        else {
                            // We aren't looping and can't reverse, so stop
                            this.end(key);
                        }
                    }
                    // Check for the end of reversing
                    if (tween.reversing && tween.elapsedTime >= tween.startDelay + 2 * tween.duration) {
                        if (tween.loop) {
                            tween.reversing = false;
                            tween.elapsedTime -= 2 * tween.duration;
                        }
                        else {
                            this.end(key);
                        }
                    }
                    // Update the progress, make sure it is between 0 and 1. Errors from this should never be large
                    if (tween.reversing) {
                        tween.progress = MathUtils_1.default.clamp01((2 * tween.duration - (tween.elapsedTime - tween.startDelay)) / tween.duration);
                    }
                    else {
                        tween.progress = MathUtils_1.default.clamp01((tween.elapsedTime - tween.startDelay) / tween.duration);
                    }
                    for (let effect of tween.effects) {
                        // Get the value from the ease function that corresponds to our progress
                        let ease = EaseFunctions_1.default[effect.ease](tween.progress);
                        // Use the value to lerp the property
                        let value = MathUtils_1.default.lerp(effect.start, effect.end, ease);
                        // Assign the value of the property
                        this.owner[effect.property] = value;
                    }
                }
            }
        });
    }
}
exports.default = TweenController;
},{"../../DataTypes/Collections/Map":5,"../../Events/Emitter":26,"../../Utils/EaseFunctions":105,"../../Utils/MathUtils":107,"./AnimationTypes":70,"./TweenManager":74}],74:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TweenManager {
    constructor() {
        this.tweenControllers = new Array();
    }
    static getInstance() {
        if (TweenManager.instance === null) {
            TweenManager.instance = new TweenManager();
        }
        return TweenManager.instance;
    }
    registerTweenController(controller) {
        this.tweenControllers.push(controller);
    }
    deregisterTweenController(controller) {
        let index = this.tweenControllers.indexOf(controller);
        this.tweenControllers.splice(index, 1);
    }
    clearTweenControllers() {
        this.tweenControllers = new Array();
    }
    update(deltaT) {
        for (let tweenController of this.tweenControllers) {
            tweenController.update(deltaT);
        }
    }
}
exports.default = TweenManager;
TweenManager.instance = null;
},{}],75:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graphic_1 = __importDefault(require("../Nodes/Graphic"));
const Point_1 = __importDefault(require("../Nodes/Graphics/Point"));
const Rect_1 = __importDefault(require("../Nodes/Graphics/Rect"));
const Sprite_1 = __importDefault(require("../Nodes/Sprites/Sprite"));
const UIElement_1 = __importDefault(require("../Nodes/UIElement"));
const GraphicRenderer_1 = __importDefault(require("./CanvasRendering/GraphicRenderer"));
const RenderingManager_1 = __importDefault(require("./RenderingManager"));
const TilemapRenderer_1 = __importDefault(require("./CanvasRendering/TilemapRenderer"));
const UIElementRenderer_1 = __importDefault(require("./CanvasRendering/UIElementRenderer"));
const Label_1 = __importDefault(require("../Nodes/UIElements/Label"));
const Button_1 = __importDefault(require("../Nodes/UIElements/Button"));
const Slider_1 = __importDefault(require("../Nodes/UIElements/Slider"));
const TextInput_1 = __importDefault(require("../Nodes/UIElements/TextInput"));
const AnimatedSprite_1 = __importDefault(require("../Nodes/Sprites/AnimatedSprite"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const Line_1 = __importDefault(require("../Nodes/Graphics/Line"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
/**
 * An implementation of the RenderingManager class using CanvasRenderingContext2D.
 */
class CanvasRenderer extends RenderingManager_1.default {
    constructor() {
        super();
    }
    // @override
    setScene(scene) {
        this.scene = scene;
        this.graphicRenderer.setScene(scene);
        this.tilemapRenderer.setScene(scene);
        this.uiElementRenderer.setScene(scene);
    }
    // @override
    initializeCanvas(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
        this.worldSize = new Vec2_1.default(width, height);
        this.ctx = canvas.getContext("2d");
        this.graphicRenderer = new GraphicRenderer_1.default(this.ctx);
        this.tilemapRenderer = new TilemapRenderer_1.default(this.ctx);
        this.uiElementRenderer = new UIElementRenderer_1.default(this.ctx);
        // For crisp pixel art
        this.ctx.imageSmoothingEnabled = false;
        return this.ctx;
    }
    // @override
    render(visibleSet, tilemaps, uiLayers) {
        // Sort by depth, then by visible set by y-value
        visibleSet.sort((a, b) => {
            if (a.getLayer().getDepth() === b.getLayer().getDepth()) {
                return (a.boundary.bottom) - (b.boundary.bottom);
            }
            else {
                return a.getLayer().getDepth() - b.getLayer().getDepth();
            }
        });
        let tilemapIndex = 0;
        let tilemapLength = tilemaps.length;
        let visibleSetIndex = 0;
        let visibleSetLength = visibleSet.length;
        while (tilemapIndex < tilemapLength || visibleSetIndex < visibleSetLength) {
            // Check conditions where we've already reached the edge of one list
            if (tilemapIndex >= tilemapLength) {
                // Only render the remaining visible set
                let node = visibleSet[visibleSetIndex++];
                if (node.visible) {
                    this.renderNode(node);
                }
                continue;
            }
            if (visibleSetIndex >= visibleSetLength) {
                // Only render tilemaps
                this.renderTilemap(tilemaps[tilemapIndex++]);
                continue;
            }
            // Render whichever is further down
            if (tilemaps[tilemapIndex].getLayer().getDepth() <= visibleSet[visibleSetIndex].getLayer().getDepth()) {
                this.renderTilemap(tilemaps[tilemapIndex++]);
            }
            else {
                let node = visibleSet[visibleSetIndex++];
                if (node.visible) {
                    this.renderNode(node);
                }
            }
        }
        // Render the uiLayers on top of everything else
        let sortedUILayers = new Array();
        uiLayers.forEach(key => sortedUILayers.push(uiLayers.get(key)));
        sortedUILayers = sortedUILayers.sort((ui1, ui2) => ui1.getDepth() - ui2.getDepth());
        sortedUILayers.forEach(uiLayer => {
            if (!uiLayer.isHidden())
                uiLayer.getItems().forEach(node => {
                    if (node.visible) {
                        this.renderNode(node);
                    }
                });
        });
    }
    /**
     * Renders a specified CanvasNode
     * @param node The CanvasNode to render
     */
    renderNode(node) {
        // Calculate the origin of the viewport according to this sprite
        this.origin = this.scene.getViewTranslation(node);
        // Get the zoom level of the scene
        this.zoom = this.scene.getViewScale();
        // Move the canvas to the position of the node and rotate
        let xScale = 1;
        let yScale = 1;
        if (node instanceof Sprite_1.default) {
            xScale = node.invertX ? -1 : 1;
            yScale = node.invertY ? -1 : 1;
        }
        this.ctx.setTransform(xScale, 0, 0, yScale, (node.position.x - this.origin.x) * this.zoom, (node.position.y - this.origin.y) * this.zoom);
        this.ctx.rotate(-node.rotation);
        let globalAlpha = this.ctx.globalAlpha;
        if (node instanceof Rect_1.default) {
            Debug_1.default.log("node" + node.id, "Node" + node.id + " Alpha: " + node.alpha);
        }
        this.ctx.globalAlpha = node.alpha;
        if (node instanceof AnimatedSprite_1.default) {
            this.renderAnimatedSprite(node);
        }
        else if (node instanceof Sprite_1.default) {
            this.renderSprite(node);
        }
        else if (node instanceof Graphic_1.default) {
            this.renderGraphic(node);
        }
        else if (node instanceof UIElement_1.default) {
            this.renderUIElement(node);
        }
        this.ctx.globalAlpha = globalAlpha;
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    // @override
    renderSprite(sprite) {
        // Get the image from the resource manager
        let image = this.resourceManager.getImage(sprite.imageId);
        /*
            Coordinates in the space of the image:
                image crop start -> x, y
                image crop size  -> w, h
            Coordinates in the space of the world
                image draw start -> x, y
                image draw size  -> w, h
        */
        this.ctx.drawImage(image, sprite.imageOffset.x, sprite.imageOffset.y, sprite.size.x, sprite.size.y, (-sprite.size.x * sprite.scale.x / 2) * this.zoom, (-sprite.size.y * sprite.scale.y / 2) * this.zoom, sprite.size.x * sprite.scale.x * this.zoom, sprite.size.y * sprite.scale.y * this.zoom);
    }
    // @override
    renderAnimatedSprite(sprite) {
        // Get the image from the resource manager
        let image = this.resourceManager.getImage(sprite.imageId);
        let animationIndex = sprite.animation.getIndexAndAdvanceAnimation();
        let animationOffset = sprite.getAnimationOffset(animationIndex);
        /*
            Coordinates in the space of the image:
                image crop start -> x, y
                image crop size  -> w, h
            Coordinates in the space of the world (given we moved)
                image draw start -> -w/2, -h/2
                image draw size  -> w, h
        */
        this.ctx.drawImage(image, sprite.imageOffset.x + animationOffset.x, sprite.imageOffset.y + animationOffset.y, sprite.size.x, sprite.size.y, (-sprite.size.x * sprite.scale.x / 2) * this.zoom, (-sprite.size.y * sprite.scale.y / 2) * this.zoom, sprite.size.x * sprite.scale.x * this.zoom, sprite.size.y * sprite.scale.y * this.zoom);
    }
    // @override
    renderGraphic(graphic) {
        if (graphic instanceof Point_1.default) {
            this.graphicRenderer.renderPoint(graphic, this.zoom);
        }
        else if (graphic instanceof Line_1.default) {
            this.graphicRenderer.renderLine(graphic, this.origin, this.zoom);
        }
        else if (graphic instanceof Rect_1.default) {
            this.graphicRenderer.renderRect(graphic, this.zoom);
        }
    }
    // @override
    renderTilemap(tilemap) {
        this.tilemapRenderer.renderTilemap(tilemap);
    }
    // @override
    renderUIElement(uiElement) {
        if (uiElement instanceof Label_1.default) {
            this.uiElementRenderer.renderLabel(uiElement);
        }
        else if (uiElement instanceof Button_1.default) {
            this.uiElementRenderer.renderButton(uiElement);
        }
        else if (uiElement instanceof Slider_1.default) {
            this.uiElementRenderer.renderSlider(uiElement);
        }
        else if (uiElement instanceof TextInput_1.default) {
            this.uiElementRenderer.renderTextInput(uiElement);
        }
    }
    clear(clearColor) {
        this.ctx.clearRect(0, 0, this.worldSize.x, this.worldSize.y);
        this.ctx.fillStyle = clearColor.toString();
        this.ctx.fillRect(0, 0, this.worldSize.x, this.worldSize.y);
    }
}
exports.default = CanvasRenderer;
},{"../DataTypes/Vec2":23,"../Debug/Debug":24,"../Nodes/Graphic":40,"../Nodes/Graphics/Line":42,"../Nodes/Graphics/Point":44,"../Nodes/Graphics/Rect":45,"../Nodes/Sprites/AnimatedSprite":46,"../Nodes/Sprites/Sprite":47,"../Nodes/UIElement":52,"../Nodes/UIElements/Button":53,"../Nodes/UIElements/Label":54,"../Nodes/UIElements/Slider":55,"../Nodes/UIElements/TextInput":56,"./CanvasRendering/GraphicRenderer":76,"./CanvasRendering/TilemapRenderer":77,"./CanvasRendering/UIElementRenderer":78,"./RenderingManager":79}],76:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
/**
 * A utility class to help the @reference[CanvasRenderer] render @reference[Graphic]s
 */
class GraphicRenderer {
    constructor(ctx) {
        this.resourceManager = ResourceManager_1.default.getInstance();
        this.ctx = ctx;
    }
    /**
     * Sets the scene of this GraphicRenderer
     * @param scene The current scene
     */
    setScene(scene) {
        this.scene = scene;
    }
    /**
     * Renders a point
     * @param point The point to render
     * @param zoom The zoom level
     */
    renderPoint(point, zoom) {
        this.ctx.fillStyle = point.color.toStringRGBA();
        this.ctx.fillRect((-point.size.x / 2) * zoom, (-point.size.y / 2) * zoom, point.size.x * zoom, point.size.y * zoom);
    }
    renderLine(line, origin, zoom) {
        this.ctx.strokeStyle = line.color.toStringRGBA();
        this.ctx.lineWidth = line.thickness;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo((line.end.x - line.start.x) * zoom, (line.end.y - line.start.y) * zoom);
        this.ctx.closePath();
        this.ctx.stroke();
    }
    /**
     * Renders a rect
     * @param rect The rect to render
     * @param zoom The zoom level
     */
    renderRect(rect, zoom) {
        // Draw the interior of the rect
        if (rect.color.a !== 0) {
            this.ctx.fillStyle = rect.color.toStringRGB();
            this.ctx.fillRect((-rect.size.x / 2) * zoom, (-rect.size.y / 2) * zoom, rect.size.x * zoom, rect.size.y * zoom);
        }
        // Draw the border of the rect if it isn't transparent
        if (rect.borderColor.a !== 0) {
            this.ctx.strokeStyle = rect.getBorderColor().toStringRGB();
            this.ctx.lineWidth = rect.getBorderWidth();
            this.ctx.strokeRect((-rect.size.x / 2) * zoom, (-rect.size.y / 2) * zoom, rect.size.x * zoom, rect.size.y * zoom);
        }
    }
}
exports.default = GraphicRenderer;
},{"../../ResourceManager/ResourceManager":88}],77:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
/**
 * A utility class for the @reference[CanvasRenderer] to render @reference[Tilemap]s
 */
class TilemapRenderer {
    constructor(ctx) {
        this.resourceManager = ResourceManager_1.default.getInstance();
        this.ctx = ctx;
    }
    /**
     * Sets the scene of this TilemapRenderer
     * @param scene The current scene
     */
    setScene(scene) {
        this.scene = scene;
    }
    /**
     * Renders an orthogonal tilemap
     * @param tilemap The tilemap to render
     */
    renderTilemap(tilemap) {
        let previousAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = tilemap.getLayer().getAlpha();
        let origin = this.scene.getViewTranslation(tilemap);
        let size = this.scene.getViewport().getHalfSize();
        let zoom = this.scene.getViewScale();
        let bottomRight = origin.clone().add(size.scaled(2 * zoom));
        if (tilemap.visible) {
            let minColRow = tilemap.getMinColRow(this.scene.getViewport().getView());
            let maxColRow = tilemap.getMaxColRow(this.scene.getViewport().getView());
            for (let row = minColRow.y; row <= maxColRow.y; row++) {
                for (let col = minColRow.x; col <= maxColRow.x; col++) {
                    // Get the tile at this position
                    let tile = tilemap.getTile(col, row);
                    // Extract the rot/flip parameters if there are any
                    const mask = (0xE << 28);
                    const rotFlip = ((mask & tile) >> 28) & 0xF;
                    tile = tile & ~mask;
                    // Find the tileset that owns this tile index and render
                    for (let tileset of tilemap.getTilesets()) {
                        if (tileset.hasTile(tile)) {
                            this.renderTile(tilemap, tileset, tile, col, row, origin, tilemap.scale, zoom, rotFlip);
                        }
                    }
                }
            }
        }
        this.ctx.globalAlpha = previousAlpha;
    }
    /**
     * Renders a tile
     * @param tileset The tileset this tile belongs to
     * @param tileIndex The index of the tile
     * @param tilemapRow The row of the tile in the tilemap
     * @param tilemapCol The column of the tile in the tilemap
     * @param origin The origin of the viewport
     * @param scale The scale of the tilemap
     * @param zoom The zoom level of the viewport
     */
    renderTile(tilemap, tileset, tileIndex, tilemapCol, tilemapRow, origin, scale, zoom, rotFlip) {
        let image = this.resourceManager.getImage(tileset.getImageKey());
        // Get the size of the tile to render
        let tileSize = tileset.getTileSize();
        let width = tileSize.x;
        let height = tileSize.y;
        // Calculate the position to start a crop in the tileset image
        let imagePosition = tileset.getImageOffsetForTile(tileIndex);
        let left = imagePosition.x;
        let top = imagePosition.y;
        // Calculate the position in the world to render the tile
        let worldPosition = tilemap.getWorldPosition(tilemapCol, tilemapRow);
        let worldX = Math.floor((worldPosition.x - origin.x) * zoom);
        let worldY = Math.floor((worldPosition.y - origin.y) * zoom);
        // Calculate the size of the world to render the tile in
        let worldWidth = Math.ceil(width * scale.x * zoom);
        let worldHeight = Math.ceil(height * scale.y * zoom);
        if (rotFlip !== 0) {
            let scaleX = 1;
            let scaleY = 1;
            let shearX = 0;
            let shearY = 0;
            // Flip on the x-axis
            if (rotFlip & 8) {
                scaleX = -1;
            }
            // Flip on the y-axis
            if (rotFlip & 4) {
                scaleY = -1;
            }
            // Flip over the line y=x
            if (rotFlip & 2) {
                shearX = scaleY;
                shearY = scaleX;
                scaleX = 0;
                scaleY = 0;
            }
            this.ctx.setTransform(scaleX, shearX, shearY, scaleY, worldX + worldWidth / 2, worldY + worldHeight / 2);
            // Render the tile
            this.ctx.drawImage(image, left, top, width, height, -worldWidth / 2, -worldHeight / 2, worldWidth, worldHeight);
            if (rotFlip !== 0) {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
        }
        else {
            // No rotations, don't do the calculations, just render the tile
            // Render the tile
            this.ctx.drawImage(image, left, top, width, height, worldX, worldY, worldWidth, worldHeight);
        }
    }
    getOrthogonalTileDrawPos(map, set, col, row) {
        let imgsize = set.getTileSize().mult(map.scale);
        let mapsize = map.getScaledTileSize();
        return map.getWorldPosition(col, row).sub(imgsize.sub(mapsize));
    }
    getIsometricTileDrawPos(map, set, col, row) {
        let size = set.getTileSize();
        let drawPos = map.getScaledTileSize().sub(new Vec2_1.default(size.x * map.scale.x, size.y * map.scale.y));
        drawPos.inc(-size.x * map.scale.x / 2, 0);
        drawPos.add(map.getWorldPosition(col, row));
        return drawPos;
    }
}
exports.default = TilemapRenderer;
},{"../../DataTypes/Vec2":23,"../../ResourceManager/ResourceManager":88}],78:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const MathUtils_1 = __importDefault(require("../../Utils/MathUtils"));
/**
 * A utility class to help the @reference[CanvasRenderer] render @reference[UIElement]s
 */
class UIElementRenderer {
    constructor(ctx) {
        this.resourceManager = ResourceManager_1.default.getInstance();
        this.ctx = ctx;
    }
    /**
     * Sets the scene of this UIElementRenderer
     * @param scene The current scene
     */
    setScene(scene) {
        this.scene = scene;
    }
    /**
     * Renders a label
     * @param label The label to render
     */
    renderLabel(label) {
        // If the size is unassigned (by the user or automatically) assign it
        label.handleInitialSizing(this.ctx);
        // Grab the global alpha so we can adjust it for this render
        let previousAlpha = this.ctx.globalAlpha;
        // Get the font and text position in label
        this.ctx.font = label.getFontString();
        let offset = label.calculateTextOffset(this.ctx);
        // Stroke and fill a rounded rect and give it text
        this.ctx.globalAlpha = label.backgroundColor.a;
        this.ctx.fillStyle = label.calculateBackgroundColor().toStringRGBA();
        this.ctx.fillRoundedRect(-label.size.x / 2, -label.size.y / 2, label.size.x, label.size.y, label.borderRadius);
        this.ctx.strokeStyle = label.calculateBorderColor().toStringRGBA();
        this.ctx.globalAlpha = label.borderColor.a;
        this.ctx.lineWidth = label.borderWidth;
        this.ctx.strokeRoundedRect(-label.size.x / 2, -label.size.y / 2, label.size.x, label.size.y, label.borderRadius);
        this.ctx.fillStyle = label.calculateTextColor();
        this.ctx.globalAlpha = label.textColor.a;
        this.ctx.fillText(label.text, offset.x - label.size.x / 2, offset.y - label.size.y / 2);
        this.ctx.globalAlpha = previousAlpha;
    }
    /**
     * Renders a button
     * @param button The button to render
     */
    renderButton(button) {
        this.renderLabel(button);
    }
    /**
     * Renders a slider
     * @param slider The slider to render
     */
    renderSlider(slider) {
        // Grab the global alpha so we can adjust it for this render
        let previousAlpha = this.ctx.globalAlpha;
        this.ctx.globalAlpha = slider.getLayer().getAlpha();
        // Calcualate the slider size
        let sliderSize = new Vec2_1.default(slider.size.x, 2);
        // Draw the slider
        this.ctx.fillStyle = slider.sliderColor.toString();
        this.ctx.fillRoundedRect(-sliderSize.x / 2, -sliderSize.y / 2, sliderSize.x, sliderSize.y, slider.borderRadius);
        // Calculate the nib size and position
        let x = MathUtils_1.default.lerp(-slider.size.x / 2, slider.size.x / 2, slider.getValue());
        // Draw the nib
        this.ctx.fillStyle = slider.nibColor.toString();
        this.ctx.fillRoundedRect(x - slider.nibSize.x / 2, -slider.nibSize.y / 2, slider.nibSize.x, slider.nibSize.y, slider.borderRadius);
        // Reset the alpha
        this.ctx.globalAlpha = previousAlpha;
    }
    /**
     * Renders a textInput
     * @param textInput The textInput to render
     */
    renderTextInput(textInput) {
        // Show a cursor sometimes
        if (textInput.focused && textInput.cursorCounter % 60 > 30) {
            textInput.text += "|";
        }
        this.renderLabel(textInput);
        if (textInput.focused) {
            if (textInput.cursorCounter % 60 > 30) {
                textInput.text = textInput.text.substring(0, textInput.text.length - 1);
            }
            textInput.cursorCounter += 1;
            if (textInput.cursorCounter >= 60) {
                textInput.cursorCounter = 0;
            }
        }
    }
}
exports.default = UIElementRenderer;
},{"../../DataTypes/Vec2":23,"../../ResourceManager/ResourceManager":88,"../../Utils/MathUtils":107}],79:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
/**
 * An abstract framework to put all rendering in once place in the application
 */
class RenderingManager {
    constructor() {
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    /**
     * Sets the scene currently being rendered
     * @param scene The current Scene
     */
    setScene(scene) {
        this.scene = scene;
    }
}
exports.default = RenderingManager;
},{"../ResourceManager/ResourceManager":88}],80:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const Graphic_1 = __importDefault(require("../Nodes/Graphic"));
const Point_1 = __importDefault(require("../Nodes/Graphics/Point"));
const Rect_1 = __importDefault(require("../Nodes/Graphics/Rect"));
const AnimatedSprite_1 = __importDefault(require("../Nodes/Sprites/AnimatedSprite"));
const Sprite_1 = __importDefault(require("../Nodes/Sprites/Sprite"));
const UIElement_1 = __importDefault(require("../Nodes/UIElement"));
const Label_1 = __importDefault(require("../Nodes/UIElements/Label"));
const ShaderRegistry_1 = __importDefault(require("../Registry/Registries/ShaderRegistry"));
const RegistryManager_1 = __importDefault(require("../Registry/RegistryManager"));
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
const ParallaxLayer_1 = __importDefault(require("../Scene/Layers/ParallaxLayer"));
const RenderingManager_1 = __importDefault(require("./RenderingManager"));
class WebGLRenderer extends RenderingManager_1.default {
    initializeCanvas(canvas, width, height) {
        canvas.width = width;
        canvas.height = height;
        this.worldSize = Vec2_1.default.ZERO;
        this.worldSize.x = width;
        this.worldSize.y = height;
        // Get the WebGL context
        this.gl = canvas.getContext("webgl");
        this.gl.viewport(0, 0, canvas.width, canvas.height);
        this.gl.disable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.CULL_FACE);
        // Tell the resource manager we're using WebGL
        ResourceManager_1.default.getInstance().useWebGL(true, this.gl);
        // Show the text canvas and get its context
        let textCanvas = document.getElementById("text-canvas");
        textCanvas.hidden = false;
        this.textCtx = textCanvas.getContext("2d");
        // Size the text canvas to be the same as the game canvas
        textCanvas.height = height;
        textCanvas.width = width;
        return this.gl;
    }
    render(visibleSet, tilemaps, uiLayers) {
        for (let node of visibleSet) {
            this.renderNode(node);
        }
        uiLayers.forEach(key => {
            if (!uiLayers.get(key).isHidden())
                uiLayers.get(key).getItems().forEach(node => this.renderNode(node));
        });
    }
    clear(color) {
        this.gl.clearColor(color.r, color.g, color.b, color.a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.textCtx.clearRect(0, 0, this.worldSize.x, this.worldSize.y);
    }
    renderNode(node) {
        // Calculate the origin of the viewport according to this sprite
        this.origin = this.scene.getViewTranslation(node);
        // Get the zoom level of the scene
        this.zoom = this.scene.getViewScale();
        if (node.hasCustomShader) {
            // If the node has a custom shader, render using that
            this.renderCustom(node);
        }
        else if (node instanceof Graphic_1.default) {
            this.renderGraphic(node);
        }
        else if (node instanceof Sprite_1.default) {
            if (node instanceof AnimatedSprite_1.default) {
                this.renderAnimatedSprite(node);
            }
            else {
                this.renderSprite(node);
            }
        }
        else if (node instanceof UIElement_1.default) {
            this.renderUIElement(node);
        }
    }
    renderSprite(sprite) {
        let shader = RegistryManager_1.default.shaders.get(ShaderRegistry_1.default.SPRITE_SHADER);
        let options = this.addOptions(shader.getOptions(sprite), sprite);
        shader.render(this.gl, options);
    }
    renderAnimatedSprite(sprite) {
        let shader = RegistryManager_1.default.shaders.get(ShaderRegistry_1.default.SPRITE_SHADER);
        let options = this.addOptions(shader.getOptions(sprite), sprite);
        shader.render(this.gl, options);
    }
    renderGraphic(graphic) {
        if (graphic instanceof Point_1.default) {
            let shader = RegistryManager_1.default.shaders.get(ShaderRegistry_1.default.POINT_SHADER);
            let options = this.addOptions(shader.getOptions(graphic), graphic);
            shader.render(this.gl, options);
        }
        else if (graphic instanceof Rect_1.default) {
            let shader = RegistryManager_1.default.shaders.get(ShaderRegistry_1.default.RECT_SHADER);
            let options = this.addOptions(shader.getOptions(graphic), graphic);
            shader.render(this.gl, options);
        }
    }
    renderTilemap(tilemap) {
        throw new Error("Method not implemented.");
    }
    renderUIElement(uiElement) {
        if (uiElement instanceof Label_1.default) {
            let shader = RegistryManager_1.default.shaders.get(ShaderRegistry_1.default.LABEL_SHADER);
            let options = this.addOptions(shader.getOptions(uiElement), uiElement);
            shader.render(this.gl, options);
            this.textCtx.setTransform(1, 0, 0, 1, (uiElement.position.x - this.origin.x) * this.zoom, (uiElement.position.y - this.origin.y) * this.zoom);
            this.textCtx.rotate(-uiElement.rotation);
            let globalAlpha = this.textCtx.globalAlpha;
            this.textCtx.globalAlpha = uiElement.alpha;
            // Render text
            this.textCtx.font = uiElement.getFontString();
            let offset = uiElement.calculateTextOffset(this.textCtx);
            this.textCtx.fillStyle = uiElement.calculateTextColor();
            this.textCtx.globalAlpha = uiElement.textColor.a;
            this.textCtx.fillText(uiElement.text, offset.x - uiElement.size.x / 2, offset.y - uiElement.size.y / 2);
            this.textCtx.globalAlpha = globalAlpha;
            this.textCtx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
    renderCustom(node) {
        let shader = RegistryManager_1.default.shaders.get(node.customShaderKey);
        let options = this.addOptions(shader.getOptions(node), node);
        shader.render(this.gl, options);
    }
    addOptions(options, node) {
        // Give the shader access to the world size
        options.worldSize = this.worldSize;
        // Adjust the origin position to the parallax
        let layer = node.getLayer();
        let parallax = new Vec2_1.default(1, 1);
        if (layer instanceof ParallaxLayer_1.default) {
            parallax = layer.parallax;
        }
        options.origin = this.origin.clone().mult(parallax);
        return options;
    }
}
exports.default = WebGLRenderer;
},{"../DataTypes/Vec2":23,"../Nodes/Graphic":40,"../Nodes/Graphics/Point":44,"../Nodes/Graphics/Rect":45,"../Nodes/Sprites/AnimatedSprite":46,"../Nodes/Sprites/Sprite":47,"../Nodes/UIElement":52,"../Nodes/UIElements/Label":54,"../Registry/Registries/ShaderRegistry":67,"../Registry/RegistryManager":68,"../ResourceManager/ResourceManager":88,"../Scene/Layers/ParallaxLayer":96,"./RenderingManager":79}],81:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
/**
 * A wrapper class for WebGL shaders.
 * This class is a singleton, and there is only one for each shader type.
 * All objects that use this shader type will refer to and modify this same type.
 */
class ShaderType {
    constructor(programKey) {
        this.programKey = programKey;
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    /**
     * Extracts the options from the CanvasNode and gives them to the render function
     * @param node The node to get options from
     * @returns An object containing the options that should be passed to the render function
     */
    getOptions(node) { return {}; }
}
exports.default = ShaderType;
},{"../../ResourceManager/ResourceManager":88}],82:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../DataTypes/Mat4x4"));
const Vec2_1 = __importDefault(require("../../../DataTypes/Vec2"));
const ResourceManager_1 = __importDefault(require("../../../ResourceManager/ResourceManager"));
const QuadShaderType_1 = __importDefault(require("./QuadShaderType"));
/** */
class LabelShaderType extends QuadShaderType_1.default {
    constructor(programKey) {
        super(programKey);
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    initBufferObject() {
        this.bufferObjectKey = "label";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        const backgroundColor = options.backgroundColor.toWebGL();
        const borderColor = options.borderColor.toWebGL();
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        gl.useProgram(program);
        const vertexData = this.getVertices(options.size.x, options.size.y);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        // Attributes
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        // Uniforms
        const u_BackgroundColor = gl.getUniformLocation(program, "u_BackgroundColor");
        gl.uniform4fv(u_BackgroundColor, backgroundColor);
        const u_BorderColor = gl.getUniformLocation(program, "u_BorderColor");
        gl.uniform4fv(u_BorderColor, borderColor);
        const u_MaxSize = gl.getUniformLocation(program, "u_MaxSize");
        gl.uniform2f(u_MaxSize, -vertexData[0], vertexData[1]);
        // Get transformation matrix
        // We want a square for our rendering space, so get the maximum dimension of our quad
        let maxDimension = Math.max(options.size.x, options.size.y);
        const u_BorderWidth = gl.getUniformLocation(program, "u_BorderWidth");
        gl.uniform1f(u_BorderWidth, options.borderWidth / maxDimension);
        const u_BorderRadius = gl.getUniformLocation(program, "u_BorderRadius");
        gl.uniform1f(u_BorderRadius, options.borderRadius / maxDimension);
        // The size of the rendering space will be a square with this maximum dimension
        let size = new Vec2_1.default(maxDimension, maxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
        // Center our translations around (0, 0)
        const translateX = (options.position.x - options.origin.x - options.worldSize.x / 2) / maxDimension;
        const translateY = -(options.position.y - options.origin.y - options.worldSize.y / 2) / maxDimension;
        // Create our transformation matrix
        this.translation.translate(new Float32Array([translateX, translateY]));
        this.scale.scale(size);
        this.rotation.rotate(options.rotation);
        let transformation = Mat4x4_1.default.MULT(this.translation, this.scale, this.rotation);
        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    /**
     * The rendering space always has to be a square, so make sure its square w.r.t to the largest dimension
     * @param w The width of the quad in pixels
     * @param h The height of the quad in pixels
     * @returns An array of the vertices of the quad
     */
    getVertices(w, h) {
        let x, y;
        if (h > w) {
            y = 0.5;
            x = w / (2 * h);
        }
        else {
            x = 0.5;
            y = h / (2 * w);
        }
        return new Float32Array([
            -x, y,
            -x, -y,
            x, y,
            x, -y
        ]);
    }
    getOptions(rect) {
        let options = {
            position: rect.position,
            backgroundColor: rect.calculateBackgroundColor(),
            borderColor: rect.calculateBorderColor(),
            borderWidth: rect.borderWidth,
            borderRadius: rect.borderRadius,
            size: rect.size,
            rotation: rect.rotation
        };
        return options;
    }
}
exports.default = LabelShaderType;
},{"../../../DataTypes/Mat4x4":13,"../../../DataTypes/Vec2":23,"../../../ResourceManager/ResourceManager":88,"./QuadShaderType":84}],83:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const RenderingUtils_1 = __importDefault(require("../../../Utils/RenderingUtils"));
const ShaderType_1 = __importDefault(require("../ShaderType"));
class PointShaderType extends ShaderType_1.default {
    constructor(programKey) {
        super(programKey);
    }
    initBufferObject() {
        this.bufferObjectKey = "point";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        let position = RenderingUtils_1.default.toWebGLCoords(options.position, options.origin, options.worldSize);
        let color = RenderingUtils_1.default.toWebGLColor(options.color);
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        gl.useProgram(program);
        const vertexData = position;
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        // Attributes
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        // Uniforms
        const u_Color = gl.getUniformLocation(program, "u_Color");
        gl.uniform4fv(u_Color, color);
        const u_PointSize = gl.getUniformLocation(program, "u_PointSize");
        gl.uniform1f(u_PointSize, options.pointSize);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
    getOptions(point) {
        let options = {
            position: point.position,
            color: point.color,
            pointSize: point.size,
        };
        return options;
    }
}
exports.default = PointShaderType;
},{"../../../Utils/RenderingUtils":110,"../ShaderType":81}],84:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../DataTypes/Mat4x4"));
const ShaderType_1 = __importDefault(require("../ShaderType"));
/** Represents any WebGL objects that have a quad mesh (i.e. a rectangular game object composed of only two triangles) */
class QuadShaderType extends ShaderType_1.default {
    constructor(programKey) {
        super(programKey);
        this.scale = Mat4x4_1.default.IDENTITY;
        this.rotation = Mat4x4_1.default.IDENTITY;
        this.translation = Mat4x4_1.default.IDENTITY;
    }
}
exports.default = QuadShaderType;
},{"../../../DataTypes/Mat4x4":13,"../ShaderType":81}],85:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../DataTypes/Mat4x4"));
const Vec2_1 = __importDefault(require("../../../DataTypes/Vec2"));
const ResourceManager_1 = __importDefault(require("../../../ResourceManager/ResourceManager"));
const QuadShaderType_1 = __importDefault(require("./QuadShaderType"));
/** */
class RectShaderType extends QuadShaderType_1.default {
    constructor(programKey) {
        super(programKey);
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    initBufferObject() {
        this.bufferObjectKey = "rect";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        const color = options.color.toWebGL();
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        gl.useProgram(program);
        const vertexData = this.getVertices(options.size.x, options.size.y);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        // Attributes
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        // Uniforms
        const u_Color = gl.getUniformLocation(program, "u_Color");
        gl.uniform4fv(u_Color, color);
        // Get transformation matrix
        // We want a square for our rendering space, so get the maximum dimension of our quad
        let maxDimension = Math.max(options.size.x, options.size.y);
        // The size of the rendering space will be a square with this maximum dimension
        let size = new Vec2_1.default(maxDimension, maxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
        // Center our translations around (0, 0)
        const translateX = (options.position.x - options.origin.x - options.worldSize.x / 2) / maxDimension;
        const translateY = -(options.position.y - options.origin.y - options.worldSize.y / 2) / maxDimension;
        // Create our transformation matrix
        this.translation.translate(new Float32Array([translateX, translateY]));
        this.scale.scale(size);
        this.rotation.rotate(options.rotation);
        let transformation = Mat4x4_1.default.MULT(this.translation, this.scale, this.rotation);
        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    /*
        So as it turns out, WebGL has an issue with non-square quads.
        It doesn't like when you don't have a 1-1 scale, and rotations are entirely messed up if this is not the case.
        To solve this, I used the scale of the LARGEST dimension of the quad to make a square, then adjusted the vertex coordinates inside of that.
        A diagram of the solution follows.

        There is a bounding square for the quad with dimensions hxh (in this case, since height is the largest dimension).
        The offset in the vertical direction is therefore 0.5, as it is normally.
        However, the offset in the horizontal direction is not so straightforward, but isn't conceptually hard.
        All we really have to do is a range change from [0, height/2] to [0, 0.5], where our value is t = width/2, and 0 <= t <= height/2.

        So now we have our rect, in a space scaled with respect to the largest dimension.
        Rotations work as you would expect, even for long rectangles.

                    0.5
            __ __ __ __ __ __ __
            |	|88888888888|	|
            |	|88888888888|	|
            |	|88888888888|	|
        -0.5|_ _|88888888888|_ _|0.5
            |	|88888888888|	|
            |	|88888888888|	|
            |	|88888888888|	|
            |___|88888888888|___|
                    -0.5

        The getVertices function below does as described, and converts the range
    */
    /**
     * The rendering space always has to be a square, so make sure its square w.r.t to the largest dimension
     * @param w The width of the quad in pixels
     * @param h The height of the quad in pixels
     * @returns An array of the vertices of the quad
     */
    getVertices(w, h) {
        let x, y;
        if (h > w) {
            y = 0.5;
            x = w / (2 * h);
        }
        else {
            x = 0.5;
            y = h / (2 * w);
        }
        return new Float32Array([
            -x, y,
            -x, -y,
            x, y,
            x, -y
        ]);
    }
    getOptions(rect) {
        let options = {
            position: rect.position,
            color: rect.color,
            size: rect.size,
            rotation: rect.rotation
        };
        return options;
    }
}
exports.default = RectShaderType;
},{"../../../DataTypes/Mat4x4":13,"../../../DataTypes/Vec2":23,"../../../ResourceManager/ResourceManager":88,"./QuadShaderType":84}],86:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../DataTypes/Mat4x4"));
const Vec2_1 = __importDefault(require("../../../DataTypes/Vec2"));
const ResourceManager_1 = __importDefault(require("../../../ResourceManager/ResourceManager"));
const QuadShaderType_1 = __importDefault(require("./QuadShaderType"));
class SpotlightShaderType extends QuadShaderType_1.default {
    constructor(programKey) {
        super(programKey);
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    initBufferObject() {
        this.bufferObjectKey = "spotlight";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        // Get our program and buffer object
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        // Let WebGL know we're using our shader program
        gl.useProgram(program);
        // Get our vertex data
        const vertexData = this.getVertices(options.size.x, options.size.y);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        /* ##### ATTRIBUTES ##### */
        // No texture, the only thing we care about is vertex position
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        /* ##### UNIFORMS ##### */
        // Get transformation matrix
        // We have a square for our rendering space, so get the maximum dimension of our quad
        let maxDimension = Math.max(options.size.x, options.size.y);
        // The size of the rendering space will be a square with this maximum dimension
        let size = new Vec2_1.default(maxDimension, maxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
        // Center our translations around (0, 0)
        const translateX = (options.position.x - options.origin.x - options.worldSize.x / 2) / maxDimension;
        const translateY = -(options.position.y - options.origin.y - options.worldSize.y / 2) / maxDimension;
        // Create our transformation matrix
        this.translation.translate(new Float32Array([translateX, translateY]));
        this.scale.scale(size);
        this.rotation.rotate(options.rotation);
        let transformation = Mat4x4_1.default.MULT(this.translation, this.scale, this.rotation);
        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());
        //color
        let webGL_color = options.color.toWebGL();
        const circle_Color = gl.getUniformLocation(program, "circle_Color");
        gl.uniform4f(circle_Color, webGL_color[0], webGL_color[1], webGL_color[2], webGL_color[3]);
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        const u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
        gl.uniform2f(u_LightPosition, options.lightPosition.x, options.lightPosition.y);
        const u_LightColor = gl.getUniformLocation(program, "u_LightColor");
        let webGL_lightColor = options.lightColor.toWebGL();
        gl.uniform4f(u_LightColor, webGL_lightColor[0], webGL_lightColor[1], webGL_lightColor[2], webGL_lightColor[3]);
        const u_LightRadius = gl.getUniformLocation(program, "u_LightRadius");
        gl.uniform1f(u_LightRadius, options.lightRadius);
        const u_AmbientColor = gl.getUniformLocation(program, "u_AmbientColor");
        let webGL_ambientColor = options.ambientColor.toWebGL();
        gl.uniform4f(u_AmbientColor, webGL_ambientColor[0], webGL_ambientColor[1], webGL_ambientColor[2], webGL_ambientColor[3]);
    }
    getVertices(w, h) {
        let x, y;
        if (h > w) {
            y = 0.5;
            x = w / (2 * h);
        }
        else {
            x = 0.5;
            y = h / (2 * w);
        }
        return new Float32Array([
            -x, y,
            -x, -y,
            x, y,
            x, -y
        ]);
    }
    getOptions(spotlight) {
        let options = {
            position: spotlight.position,
            size: spotlight.size,
            rotation: spotlight.rotation,
            lightPosition: spotlight.lightPosition,
            lightColor: spotlight.lightColor,
            lightRadius: spotlight.lightRadius,
            ambientColor: spotlight.ambientColor
        };
        return options;
    }
}
exports.default = SpotlightShaderType;
},{"../../../DataTypes/Mat4x4":13,"../../../DataTypes/Vec2":23,"../../../ResourceManager/ResourceManager":88,"./QuadShaderType":84}],87:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../DataTypes/Mat4x4"));
const Vec2_1 = __importDefault(require("../../../DataTypes/Vec2"));
const AnimatedSprite_1 = __importDefault(require("../../../Nodes/Sprites/AnimatedSprite"));
const ResourceManager_1 = __importDefault(require("../../../ResourceManager/ResourceManager"));
const QuadShaderType_1 = __importDefault(require("./QuadShaderType"));
/** A shader for sprites and animated sprites */
class SpriteShaderType extends QuadShaderType_1.default {
    constructor(programKey) {
        super(programKey);
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    initBufferObject() {
        this.bufferObjectKey = "sprite";
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        const texture = this.resourceManager.getTexture(options.imageKey);
        gl.useProgram(program);
        const vertexData = this.getVertices(options.size.x, options.size.y, options.scale);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        // Attributes
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 4 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        const a_TexCoord = gl.getAttribLocation(program, "a_TexCoord");
        gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, 4 * FSIZE, 2 * FSIZE);
        gl.enableVertexAttribArray(a_TexCoord);
        // Uniforms
        // Get transformation matrix
        // We want a square for our rendering space, so get the maximum dimension of our quad
        let maxDimension = Math.max(options.size.x, options.size.y);
        // The size of the rendering space will be a square with this maximum dimension
        let size = new Vec2_1.default(maxDimension, maxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
        // Center our translations around (0, 0)
        const translateX = (options.position.x - options.origin.x - options.worldSize.x / 2) / maxDimension;
        const translateY = -(options.position.y - options.origin.y - options.worldSize.y / 2) / maxDimension;
        // Create our transformation matrix
        this.translation.translate(new Float32Array([translateX, translateY]));
        this.scale.scale(size);
        this.rotation.rotate(options.rotation);
        let transformation = Mat4x4_1.default.MULT(this.translation, this.scale, this.rotation);
        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());
        // Set up our sampler with our assigned texture unit
        const u_Sampler = gl.getUniformLocation(program, "u_Sampler");
        gl.uniform1i(u_Sampler, texture);
        // Pass in texShift
        const u_texShift = gl.getUniformLocation(program, "u_texShift");
        gl.uniform2fv(u_texShift, options.texShift);
        // Pass in texScale
        const u_texScale = gl.getUniformLocation(program, "u_texScale");
        gl.uniform2fv(u_texScale, options.texScale);
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    /**
     * The rendering space always has to be a square, so make sure its square w.r.t to the largest dimension
     * @param w The width of the quad in pixels
     * @param h The height of the quad in pixels
     * @returns An array of the vertices of the quad
     */
    getVertices(w, h, scale) {
        let x, y;
        if (h > w) {
            y = 0.5;
            x = w / (2 * h);
        }
        else {
            x = 0.5;
            y = h / (2 * w);
        }
        // Scale the rendering space if needed
        x *= scale[0];
        y *= scale[1];
        return new Float32Array([
            -x, y, 0.0, 0.0,
            -x, -y, 0.0, 1.0,
            x, y, 1.0, 0.0,
            x, -y, 1.0, 1.0
        ]);
    }
    getOptions(sprite) {
        let texShift;
        let texScale;
        if (sprite instanceof AnimatedSprite_1.default) {
            let animationIndex = sprite.animation.getIndexAndAdvanceAnimation();
            let offset = sprite.getAnimationOffset(animationIndex);
            texShift = new Float32Array([offset.x / (sprite.cols * sprite.size.x), offset.y / (sprite.rows * sprite.size.y)]);
            texScale = new Float32Array([1 / (sprite.cols), 1 / (sprite.rows)]);
        }
        else {
            texShift = new Float32Array([0, 0]);
            texScale = new Float32Array([1, 1]);
        }
        let options = {
            position: sprite.position,
            rotation: sprite.rotation,
            size: sprite.size,
            scale: sprite.scale.toArray(),
            imageKey: sprite.imageId,
            texShift,
            texScale
        };
        return options;
    }
}
exports.default = SpriteShaderType;
},{"../../../DataTypes/Mat4x4":13,"../../../DataTypes/Vec2":23,"../../../Nodes/Sprites/AnimatedSprite":46,"../../../ResourceManager/ResourceManager":88,"./QuadShaderType":84}],88:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const Queue_1 = __importDefault(require("../DataTypes/Collections/Queue"));
const StringUtils_1 = __importDefault(require("../Utils/StringUtils"));
const AudioManager_1 = __importDefault(require("../Sound/AudioManager"));
const WebGLProgramType_1 = __importDefault(require("../DataTypes/Rendering/WebGLProgramType"));
/**
 * The resource manager for the game engine.
 * The resource manager interfaces with the loadable assets of a game such as images, data files,
 * and sounds, which are all found in the dist folder.
 * This class controls loading and updates the @reference[Scene] with the loading progress, so that the scene does
 * not start before all necessary assets are loaded.
 */
class ResourceManager {
    constructor() {
        this.loading = false;
        this.justLoaded = false;
        this.loadonly_imagesLoaded = 0;
        this.loadonly_imagesToLoad = 0;
        this.loadonly_imageLoadingQueue = new Queue_1.default();
        this.images = new Map_1.default();
        this.loadonly_spritesheetsLoaded = 0;
        this.loadonly_spritesheetsToLoad = 0;
        this.loadonly_spritesheetLoadingQueue = new Queue_1.default();
        this.spritesheets = new Map_1.default();
        this.loadonly_tilemapsLoaded = 0;
        this.loadonly_tilemapsToLoad = 0;
        this.loadonly_tilemapLoadingQueue = new Queue_1.default();
        this.tilemaps = new Map_1.default();
        this.loadonly_audioLoaded = 0;
        this.loadonly_audioToLoad = 0;
        this.loadonly_audioLoadingQueue = new Queue_1.default();
        this.audioBuffers = new Map_1.default();
        this.loadonly_jsonLoaded = 0;
        this.loadonly_jsonToLoad = 0;
        this.loadonly_jsonLoadingQueue = new Queue_1.default();
        this.jsonObjects = new Map_1.default();
        this.loadonly_gl_ShaderProgramsLoaded = 0;
        this.loadonly_gl_ShaderProgramsToLoad = 0;
        this.loadonly_gl_ShaderLoadingQueue = new Queue_1.default();
        this.gl_ShaderPrograms = new Map_1.default();
        this.gl_Textures = new Map_1.default();
        this.gl_NextTextureID = 0;
        this.gl_Buffers = new Map_1.default();
        this.resourcesToUnload = new Array();
        this.resourcesToKeep = new Array();
    }
    ;
    /* ######################################## SINGLETON ########################################*/
    /**
     * Returns the current instance of this class or a new instance if none exist
     * @returns The resource manager
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new ResourceManager();
        }
        return this.instance;
    }
    /* ######################################## PUBLIC FUNCTION ########################################*/
    /**
     * Activates or deactivates the use of WebGL
     * @param flag True if WebGL should be used, false otherwise
     * @param gl The instance of the graphics context, if applicable
     */
    useWebGL(flag, gl) {
        this.gl_WebGLActive = flag;
        if (this.gl_WebGLActive) {
            this.gl = gl;
        }
    }
    /**
     * Loads an image from file
     * @param key The key to associate the loaded image with
     * @param path The path to the image to load
     */
    image(key, path) {
        this.loadonly_imageLoadingQueue.enqueue({ key: key, path: path });
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepImage(key) {
        this.keepResource(key, ResourceType.IMAGE);
    }
    /**
     * Retrieves a loaded image
     * @param key The key of the loaded image
     * @returns The image element associated with this key
     */
    getImage(key) {
        let image = this.images.get(key);
        if (image === undefined) {
            throw `There is no image associated with key "${key}"`;
        }
        return image;
    }
    /**
     * Loads a spritesheet from file
     * @param key The key to associate the loaded spritesheet with
     * @param path The path to the spritesheet to load
     */
    spritesheet(key, path) {
        this.loadonly_spritesheetLoadingQueue.enqueue({ key: key, path: path });
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepSpritesheet(key) {
        this.keepResource(key, ResourceType.SPRITESHEET);
    }
    /**
     * Retrieves a loaded spritesheet
     * @param key The key of the spritesheet to load
     * @returns The loaded Spritesheet
     */
    getSpritesheet(key) {
        return this.spritesheets.get(key);
    }
    /**
     * Loads an audio file
     * @param key The key to associate with the loaded audio file
     * @param path The path to the audio file to load
     */
    audio(key, path) {
        this.loadonly_audioLoadingQueue.enqueue({ key: key, path: path });
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepAudio(key) {
        this.keepResource(key, ResourceType.AUDIO);
    }
    /**
     * Retrieves a loaded audio file
     * @param key The key of the audio file to load
     * @returns The AudioBuffer created from the loaded audio fle
     */
    getAudio(key) {
        return this.audioBuffers.get(key);
    }
    /**
     * Load a tilemap from a json file. Automatically loads related images
     * @param key The key to associate with the loaded tilemap
     * @param path The path to the tilemap to load
     */
    tilemap(key, path) {
        this.loadonly_tilemapLoadingQueue.enqueue({ key: key, path: path });
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepTilemap(key) {
        this.keepResource(key, ResourceType.TILEMAP);
    }
    /**
     * Retreives a loaded tilemap
     * @param key The key of the loaded tilemap
     * @returns The tilemap data associated with the key
     */
    getTilemap(key) {
        return this.tilemaps.get(key);
    }
    /**
     * Loads an object from a json file.
     * @param key The key to associate with the loaded object
     * @param path The path to the json file to load
     */
    object(key, path) {
        this.loadonly_jsonLoadingQueue.enqueue({ key: key, path: path });
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepObject(key) {
        this.keepResource(key, ResourceType.JSON);
    }
    /**
     * Retreives a loaded object
     * @param key The key of the loaded object
     * @returns The object data associated with the key
     */
    getObject(key) {
        return this.jsonObjects.get(key);
    }
    /* ######################################## LOAD FUNCTION ########################################*/
    /**
     * Loads all resources currently in the queue
     * @param callback The function to cal when the resources are finished loading
     */
    loadResourcesFromQueue(callback) {
        this.loadonly_typesToLoad = 5;
        this.loading = true;
        // Load everything in the queues. Tilemaps have to come before images because they will add new images to the queue
        this.loadTilemapsFromQueue(() => {
            console.log("Loaded Tilemaps");
            this.loadSpritesheetsFromQueue(() => {
                console.log("Loaded Spritesheets");
                this.loadImagesFromQueue(() => {
                    console.log("Loaded Images");
                    this.loadAudioFromQueue(() => {
                        console.log("Loaded Audio");
                        this.loadObjectsFromQueue(() => {
                            console.log("Loaded Objects");
                            if (this.gl_WebGLActive) {
                                this.gl_LoadShadersFromQueue(() => {
                                    console.log("Loaded Shaders");
                                    this.finishLoading(callback);
                                });
                            }
                            else {
                                this.finishLoading(callback);
                            }
                        });
                    });
                });
            });
        });
    }
    finishLoading(callback) {
        // Done loading
        this.loading = false;
        this.justLoaded = true;
        callback();
    }
    /* ######################################## UNLOAD FUNCTION ########################################*/
    keepResource(key, type) {
        console.log("Keep resource...");
        for (let i = 0; i < this.resourcesToUnload.length; i++) {
            let resource = this.resourcesToUnload[i];
            if (resource.key === key && resource.resourceType === type) {
                console.log("Found resource " + key + " of type " + type + ". Keeping.");
                let resourceToMove = this.resourcesToUnload.splice(i, 1);
                this.resourcesToKeep.push(...resourceToMove);
                return;
            }
        }
    }
    /**
     * Deletes references to all resources in the resource manager
     */
    unloadAllResources() {
        this.loading = false;
        this.justLoaded = false;
        for (let resource of this.resourcesToUnload) {
            // Unload the resource
            this.unloadResource(resource);
        }
    }
    unloadResource(resource) {
        // Delete the resource itself
        switch (resource.resourceType) {
            case ResourceType.IMAGE:
                this.images.delete(resource.key);
                if (this.gl_WebGLActive) {
                    this.gl_Textures.delete(resource.key);
                }
                break;
            case ResourceType.TILEMAP:
                this.tilemaps.delete(resource.key);
                break;
            case ResourceType.SPRITESHEET:
                this.spritesheets.delete(resource.key);
                break;
            case ResourceType.AUDIO:
                this.audioBuffers.delete(resource.key);
                break;
            case ResourceType.JSON:
                this.jsonObjects.delete(resource.key);
                break;
            /*case ResourceType.SHADER:
                this.gl_ShaderPrograms.get(resource.key).delete(this.gl);
                this.gl_ShaderPrograms.delete(resource.key);
                break;*/
        }
        // Delete any dependencies
        for (let dependency of resource.dependencies) {
            this.unloadResource(dependency);
        }
    }
    /* ######################################## WORK FUNCTIONS ########################################*/
    /**
     * Loads all tilemaps currently in the tilemap loading queue
     * @param onFinishLoading The function to call when loading is complete
     */
    loadTilemapsFromQueue(onFinishLoading) {
        this.loadonly_tilemapsToLoad = this.loadonly_tilemapLoadingQueue.getSize();
        this.loadonly_tilemapsLoaded = 0;
        // If no items to load, we're finished
        if (this.loadonly_tilemapsToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_tilemapLoadingQueue.hasItems()) {
            let tilemap = this.loadonly_tilemapLoadingQueue.dequeue();
            this.loadTilemap(tilemap.key, tilemap.path, onFinishLoading);
        }
    }
    /**
     * Loads a singular tilemap
     * @param key The key of the tilemap
     * @param pathToTilemapJSON The path to the tilemap JSON file
     * @param callbackIfLast The function to call if this is the last tilemap to load
     */
    loadTilemap(key, pathToTilemapJSON, callbackIfLast) {
        this.loadTextFile(pathToTilemapJSON, (fileText) => {
            let tilemapObject = JSON.parse(fileText);
            // We can parse the object later - it's much faster than loading
            this.tilemaps.add(key, tilemapObject);
            let resource = new ResourceReference(key, ResourceType.TILEMAP);
            // Grab the tileset images we need to load and add them to the imageloading queue
            for (let tileset of tilemapObject.tilesets) {
                if (tileset.image) {
                    let key = tileset.image;
                    let path = StringUtils_1.default.getPathFromFilePath(pathToTilemapJSON) + key;
                    this.loadonly_imageLoadingQueue.enqueue({ key: key, path: path, isDependency: true });
                    // Add this image as a dependency to the tilemap
                    resource.addDependency(new ResourceReference(key, ResourceType.IMAGE));
                }
                else if (tileset.tiles) {
                    for (let tile of tileset.tiles) {
                        let key = tile.image;
                        let path = StringUtils_1.default.getPathFromFilePath(pathToTilemapJSON) + key;
                        this.loadonly_imageLoadingQueue.enqueue({ key: key, path: path, isDependency: true });
                        // Add this image as a dependency to the tilemap
                        resource.addDependency(new ResourceReference(key, ResourceType.IMAGE));
                    }
                }
            }
            // Add the resource reference to the list of resource to unload
            this.resourcesToUnload.push(resource);
            // Finish loading
            this.finishLoadingTilemap(callbackIfLast);
        });
    }
    /**
     * Finish loading a tilemap. Calls the callback function if this is the last tilemap being loaded
     * @param callback The function to call if this is the last tilemap to load
     */
    finishLoadingTilemap(callback) {
        this.loadonly_tilemapsLoaded += 1;
        if (this.loadonly_tilemapsLoaded === this.loadonly_tilemapsToLoad) {
            // We're done loading tilemaps
            callback();
        }
    }
    /**
     * Loads all spritesheets currently in the spritesheet loading queue
     * @param onFinishLoading The function to call when the spritesheets are done loading
     */
    loadSpritesheetsFromQueue(onFinishLoading) {
        this.loadonly_spritesheetsToLoad = this.loadonly_spritesheetLoadingQueue.getSize();
        this.loadonly_spritesheetsLoaded = 0;
        // If no items to load, we're finished
        if (this.loadonly_spritesheetsToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_spritesheetLoadingQueue.hasItems()) {
            let spritesheet = this.loadonly_spritesheetLoadingQueue.dequeue();
            this.loadSpritesheet(spritesheet.key, spritesheet.path, onFinishLoading);
        }
    }
    /**
     * Loads a singular spritesheet
     * @param key The key of the spritesheet to load
     * @param pathToSpritesheetJSON The path to the spritesheet JSON file
     * @param callbackIfLast The function to call if this is the last spritesheet
     */
    loadSpritesheet(key, pathToSpritesheetJSON, callbackIfLast) {
        this.loadTextFile(pathToSpritesheetJSON, (fileText) => {
            let spritesheet = JSON.parse(fileText);
            // We can parse the object later - it's much faster than loading
            this.spritesheets.add(key, spritesheet);
            let resource = new ResourceReference(key, ResourceType.SPRITESHEET);
            // Grab the image we need to load and add it to the imageloading queue
            let path = StringUtils_1.default.getPathFromFilePath(pathToSpritesheetJSON) + spritesheet.spriteSheetImage;
            this.loadonly_imageLoadingQueue.enqueue({ key: spritesheet.name, path: path, isDependency: true });
            resource.addDependency(new ResourceReference(spritesheet.name, ResourceType.IMAGE));
            this.resourcesToUnload.push(resource);
            // Finish loading
            this.finishLoadingSpritesheet(callbackIfLast);
        });
    }
    /**
     * Finish loading a spritesheet. Calls the callback function if this is the last spritesheet being loaded
     * @param callback The function to call if this is the last spritesheet to load
     */
    finishLoadingSpritesheet(callback) {
        this.loadonly_spritesheetsLoaded += 1;
        if (this.loadonly_spritesheetsLoaded === this.loadonly_spritesheetsToLoad) {
            // We're done loading spritesheets
            callback();
        }
    }
    /**
     * Loads all images currently in the image loading queue
     * @param onFinishLoading The function to call when there are no more images to load
     */
    loadImagesFromQueue(onFinishLoading) {
        this.loadonly_imagesToLoad = this.loadonly_imageLoadingQueue.getSize();
        this.loadonly_imagesLoaded = 0;
        // If no items to load, we're finished
        if (this.loadonly_imagesToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_imageLoadingQueue.hasItems()) {
            let image = this.loadonly_imageLoadingQueue.dequeue();
            this.loadImage(image.key, image.path, image.isDependency, onFinishLoading);
        }
    }
    /**
     * Loads a singular image
     * @param key The key of the image to load
     * @param path The path to the image to load
     * @param callbackIfLast The function to call if this is the last image
     */
    loadImage(key, path, isDependency, callbackIfLast) {
        var image = new Image();
        image.onload = () => {
            // Add to loaded images
            this.images.add(key, image);
            // If not a dependency, push it to the unload list. Otherwise it's managed by something else
            if (!isDependency) {
                this.resourcesToUnload.push(new ResourceReference(key, ResourceType.IMAGE));
            }
            // If WebGL is active, create a texture
            if (this.gl_WebGLActive) {
                this.createWebGLTexture(key, image);
            }
            // Finish image load
            this.finishLoadingImage(callbackIfLast);
        };
        image.src = path;
    }
    /**
     * Finish loading an image. If this is the last image, it calls the callback function
     * @param callback The function to call if this is the last image
     */
    finishLoadingImage(callback) {
        this.loadonly_imagesLoaded += 1;
        if (this.loadonly_imagesLoaded === this.loadonly_imagesToLoad) {
            // We're done loading images
            callback();
        }
    }
    /**
     * Loads all audio currently in the tilemap loading queue
     * @param onFinishLoading The function to call when tilemaps are done loading
     */
    loadAudioFromQueue(onFinishLoading) {
        this.loadonly_audioToLoad = this.loadonly_audioLoadingQueue.getSize();
        this.loadonly_audioLoaded = 0;
        // If no items to load, we're finished
        if (this.loadonly_audioToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_audioLoadingQueue.hasItems()) {
            let audio = this.loadonly_audioLoadingQueue.dequeue();
            this.loadAudio(audio.key, audio.path, onFinishLoading);
        }
    }
    /**
     * Load a singular audio file
     * @param key The key to the audio file to load
     * @param path The path to the audio file to load
     * @param callbackIfLast The function to call if this is the last audio file to load
     */
    loadAudio(key, path, callbackIfLast) {
        let audioCtx = AudioManager_1.default.getInstance().getAudioContext();
        let request = new XMLHttpRequest();
        request.open('GET', path, true);
        request.responseType = 'arraybuffer';
        request.onload = () => {
            audioCtx.decodeAudioData(request.response, (buffer) => {
                // Add to list of audio buffers
                this.audioBuffers.add(key, buffer);
                this.resourcesToUnload.push(new ResourceReference(key, ResourceType.AUDIO));
                // Finish loading sound
                this.finishLoadingAudio(callbackIfLast);
            }, (error) => {
                throw "Error loading sound";
            });
        };
        request.send();
    }
    /**
     * Finish loading an audio file. Calls the callback functon if this is the last audio sample being loaded.
     * @param callback The function to call if this is the last audio file to load
     */
    finishLoadingAudio(callback) {
        this.loadonly_audioLoaded += 1;
        if (this.loadonly_audioLoaded === this.loadonly_audioToLoad) {
            // We're done loading audio
            callback();
        }
    }
    /**
     * Loads all objects currently in the object loading queue
     * @param onFinishLoading The function to call when there are no more objects to load
     */
    loadObjectsFromQueue(onFinishLoading) {
        this.loadonly_jsonToLoad = this.loadonly_jsonLoadingQueue.getSize();
        this.loadonly_jsonLoaded = 0;
        // If no items to load, we're finished
        if (this.loadonly_jsonToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_jsonLoadingQueue.hasItems()) {
            let obj = this.loadonly_jsonLoadingQueue.dequeue();
            this.loadObject(obj.key, obj.path, onFinishLoading);
        }
    }
    /**
     * Loads a singular object
     * @param key The key of the object to load
     * @param path The path to the object to load
     * @param callbackIfLast The function to call if this is the last object
     */
    loadObject(key, path, callbackIfLast) {
        this.loadTextFile(path, (fileText) => {
            let obj = JSON.parse(fileText);
            this.jsonObjects.add(key, obj);
            this.resourcesToUnload.push(new ResourceReference(key, ResourceType.JSON));
            this.finishLoadingObject(callbackIfLast);
        });
    }
    /**
     * Finish loading an object. If this is the last object, it calls the callback function
     * @param callback The function to call if this is the last object
     */
    finishLoadingObject(callback) {
        this.loadonly_jsonLoaded += 1;
        if (this.loadonly_jsonLoaded === this.loadonly_jsonToLoad) {
            // We're done loading objects
            callback();
        }
    }
    /* ########## WEBGL SPECIFIC FUNCTIONS ########## */
    getTexture(key) {
        return this.gl_Textures.get(key);
    }
    getShaderProgram(key) {
        return this.gl_ShaderPrograms.get(key).program;
    }
    getBuffer(key) {
        return this.gl_Buffers.get(key);
    }
    createWebGLTexture(imageKey, image) {
        // Get the texture ID
        const textureID = this.getTextureID(this.gl_NextTextureID);
        // Create the texture
        const texture = this.gl.createTexture();
        // Set up the texture
        // Enable texture0
        this.gl.activeTexture(textureID);
        // Bind our texture to texture 0
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        // Set the texture parameters
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        // Set the texture image
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        // Add the texture to our map with the same key as the image
        this.gl_Textures.add(imageKey, this.gl_NextTextureID);
        // Increment the key
        this.gl_NextTextureID += 1;
    }
    getTextureID(id) {
        // Start with 9 cases - this can be expanded if needed, but for the best performance,
        // Textures should be stitched into an atlas
        switch (id) {
            case 0: return this.gl.TEXTURE0;
            case 1: return this.gl.TEXTURE1;
            case 2: return this.gl.TEXTURE2;
            case 3: return this.gl.TEXTURE3;
            case 4: return this.gl.TEXTURE4;
            case 5: return this.gl.TEXTURE5;
            case 6: return this.gl.TEXTURE6;
            case 7: return this.gl.TEXTURE7;
            case 8: return this.gl.TEXTURE8;
            default: return this.gl.TEXTURE9;
        }
    }
    createBuffer(key) {
        if (this.gl_WebGLActive) {
            let buffer = this.gl.createBuffer();
            this.gl_Buffers.add(key, buffer);
        }
    }
    /**
     * Enqueues loading of a new shader program
     * @param key The key of the shader program
     * @param vShaderFilepath
     * @param fShaderFilepath
     */
    shader(key, vShaderFilepath, fShaderFilepath) {
        let splitPath = vShaderFilepath.split(".");
        let end = splitPath[splitPath.length - 1];
        if (end !== "vshader") {
            throw `${vShaderFilepath} is not a valid vertex shader - must end in ".vshader`;
        }
        splitPath = fShaderFilepath.split(".");
        end = splitPath[splitPath.length - 1];
        if (end !== "fshader") {
            throw `${fShaderFilepath} is not a valid vertex shader - must end in ".fshader`;
        }
        let paths = new KeyPath_Shader();
        paths.key = key;
        paths.vpath = vShaderFilepath;
        paths.fpath = fShaderFilepath;
        console.log("put " + key + " in queue as shader");
        this.loadonly_gl_ShaderLoadingQueue.enqueue(paths);
    }
    /**
     * Tells the resource manager to keep this resource
     * @param key The key of the resource
     */
    keepShader(key) {
        this.keepResource(key, ResourceType.IMAGE);
    }
    gl_LoadShadersFromQueue(onFinishLoading) {
        this.loadonly_gl_ShaderProgramsToLoad = this.loadonly_gl_ShaderLoadingQueue.getSize();
        this.loadonly_gl_ShaderProgramsLoaded = 0;
        // If webGL isn'active or there are no items to load, we're finished
        if (!this.gl_WebGLActive || this.loadonly_gl_ShaderProgramsToLoad === 0) {
            onFinishLoading();
            return;
        }
        while (this.loadonly_gl_ShaderLoadingQueue.hasItems()) {
            let shader = this.loadonly_gl_ShaderLoadingQueue.dequeue();
            this.gl_LoadShader(shader.key, shader.vpath, shader.fpath, onFinishLoading);
        }
    }
    gl_LoadShader(key, vpath, fpath, callbackIfLast) {
        this.loadTextFile(vpath, (vFileText) => {
            const vShader = vFileText;
            this.loadTextFile(fpath, (fFileText) => {
                const fShader = fFileText;
                // Extract the program and shaders
                const [shaderProgram, vertexShader, fragmentShader] = this.createShaderProgram(vShader, fShader);
                // Create a wrapper type
                const programWrapper = new WebGLProgramType_1.default();
                programWrapper.program = shaderProgram;
                programWrapper.vertexShader = vertexShader;
                programWrapper.fragmentShader = fragmentShader;
                // Add to our map
                this.gl_ShaderPrograms.add(key, programWrapper);
                this.resourcesToUnload.push(new ResourceReference(key, ResourceType.SHADER));
                // Finish loading
                this.gl_FinishLoadingShader(callbackIfLast);
            });
        });
    }
    gl_FinishLoadingShader(callback) {
        this.loadonly_gl_ShaderProgramsLoaded += 1;
        if (this.loadonly_gl_ShaderProgramsLoaded === this.loadonly_gl_ShaderProgramsToLoad) {
            // We're done loading shaders
            callback();
        }
    }
    createShaderProgram(vShaderSource, fShaderSource) {
        const vertexShader = this.loadVertexShader(vShaderSource);
        const fragmentShader = this.loadFragmentShader(fShaderSource);
        if (vertexShader === null || fragmentShader === null) {
            // We had a problem intializing - error
            return null;
        }
        // Create a shader program
        const program = this.gl.createProgram();
        if (!program) {
            // Error creating
            console.warn("Failed to create program");
            return null;
        }
        // Attach our vertex and fragment shader
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        // Link
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            // Error linking
            const error = this.gl.getProgramInfoLog(program);
            console.warn("Failed to link program: " + error);
            // Clean up
            this.gl.deleteProgram(program);
            this.gl.deleteShader(vertexShader);
            this.gl.deleteShader(fragmentShader);
            return null;
        }
        // We successfully create a program
        return [program, vertexShader, fragmentShader];
    }
    loadVertexShader(shaderSource) {
        // Create a new vertex shader
        return this.loadShader(this.gl.VERTEX_SHADER, shaderSource);
    }
    loadFragmentShader(shaderSource) {
        // Create a new fragment shader
        return this.loadShader(this.gl.FRAGMENT_SHADER, shaderSource);
    }
    loadShader(type, shaderSource) {
        const shader = this.gl.createShader(type);
        // If we couldn't create the shader, error
        if (shader === null) {
            console.warn("Unable to create shader");
            return null;
        }
        // Add the source to the shader and compile
        this.gl.shaderSource(shader, shaderSource);
        this.gl.compileShader(shader);
        // Make sure there were no errors during this process
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            // Not compiled - error
            const error = this.gl.getShaderInfoLog(shader);
            console.warn("Failed to compile shader: " + error);
            // Clean up
            this.gl.deleteShader(shader);
            return null;
        }
        // Sucess, so return the shader
        return shader;
    }
    /* ########## GENERAL LOADING FUNCTIONS ########## */
    loadTextFile(textFilePath, callback) {
        let xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', textFilePath, true);
        xobj.onreadystatechange = function () {
            if ((xobj.readyState == 4) && (xobj.status == 200)) {
                callback(xobj.responseText);
            }
        };
        xobj.send(null);
    }
    /* ########## LOADING BAR INFO ########## */
    getLoadPercent() {
        return (this.loadonly_tilemapsLoaded / this.loadonly_tilemapsToLoad
            + this.loadonly_spritesheetsLoaded / this.loadonly_spritesheetsToLoad
            + this.loadonly_imagesLoaded / this.loadonly_imagesToLoad
            + this.loadonly_audioLoaded / this.loadonly_audioToLoad)
            / this.loadonly_typesToLoad;
    }
    update(deltaT) {
        if (this.loading) {
            if (this.onLoadProgress) {
                this.onLoadProgress(this.getLoadPercent());
            }
        }
        else if (this.justLoaded) {
            this.justLoaded = false;
            if (this.onLoadComplete) {
                this.onLoadComplete();
            }
        }
    }
}
exports.default = ResourceManager;
/**
 * A class representing a reference to a resource.
 * This is used for the exemption list to assure assets and their dependencies don't get
 * destroyed if they are still needed.
 */
class ResourceReference {
    constructor(key, resourceType) {
        this.key = key;
        this.resourceType = resourceType;
        this.dependencies = new Array();
    }
    addDependency(resource) {
        this.dependencies.push(resource);
    }
}
var ResourceType;
(function (ResourceType) {
    ResourceType["IMAGE"] = "IMAGE";
    ResourceType["TILEMAP"] = "TILEMAP";
    ResourceType["SPRITESHEET"] = "SPRITESHEET";
    ResourceType["AUDIO"] = "AUDIO";
    ResourceType["JSON"] = "JSON";
    ResourceType["SHADER"] = "SHADER";
})(ResourceType || (ResourceType = {}));
/**
 * A pair representing a key and the path of the resource to load
 */
class KeyPathPair {
    constructor() {
        this.isDependency = false;
    }
}
class KeyPath_Shader {
}
},{"../DataTypes/Collections/Map":5,"../DataTypes/Collections/Queue":6,"../DataTypes/Rendering/WebGLProgramType":16,"../Sound/AudioManager":101,"../Utils/StringUtils":111}],89:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
/**
 * An abstract interface of a SceneGraph.
 * Exposes methods for use by other code, but leaves the implementation up to the subclasses.
 * The SceneGraph manages the positions of all GameNodes, and can easily prune a visible set for rendering.
 */
class SceneGraph {
    /**
     * Creates a new SceneGraph
     * @param viewport The viewport
     * @param scene The Scene this SceneGraph belongs to
     */
    constructor(viewport, scene) {
        this.viewport = viewport;
        this.scene = scene;
        this.nodeMap = new Array();
        this.idCounter = 0;
    }
    /**
     * Add a node to the SceneGraph
     * @param node The CanvasNode to add to the SceneGraph
     * @returns The SceneGraph ID of this newly added CanvasNode
     */
    addNode(node) {
        this.nodeMap[node.id] = node;
        this.addNodeSpecific(node, this.idCounter);
        this.idCounter += 1;
        return this.idCounter - 1;
    }
    ;
    /**
     * Removes a node from the SceneGraph
     * @param node The node to remove
     */
    removeNode(node) {
        // Find and remove node in O(n)
        this.nodeMap[node.id] = undefined;
        this.removeNodeSpecific(node, node.id);
    }
    ;
    /**
     * Get a specific node using its id
     * @param id The id of the CanvasNode to retrieve
     * @returns The node with this ID
     */
    getNode(id) {
        return this.nodeMap[id];
    }
    /**
     * Returns the nodes at specific coordinates
     * @param vecOrX The x-coordinate of the position, or the coordinates in a Vec2
     * @param y The y-coordinate of the position
     * @returns An array of nodes found at the position provided
     */
    getNodesAt(vecOrX, y = null) {
        if (vecOrX instanceof Vec2_1.default) {
            return this.getNodesAtCoords(vecOrX.x, vecOrX.y);
        }
        else {
            return this.getNodesAtCoords(vecOrX, y);
        }
    }
    /**
     * Returns all nodes in the SceneGraph
     * @returns An Array containing all nodes in the SceneGraph
     */
    getAllNodes() {
        let arr = new Array();
        for (let i = 0; i < this.nodeMap.length; i++) {
            if (this.nodeMap[i] !== undefined) {
                arr.push(this.nodeMap[i]);
            }
        }
        return arr;
    }
}
exports.default = SceneGraph;
},{"../DataTypes/Vec2":23}],90:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const SceneGraph_1 = __importDefault(require("./SceneGraph"));
const Stats_1 = __importDefault(require("../Debug/Stats"));
/**
 * An implementation of a SceneGraph that simply stored CanvasNodes in an array.
 */
class SceneGraphArray extends SceneGraph_1.default {
    /**
     * Creates a new SceneGraphArray
     * @param viewport The Viewport
     * @param scene The Scene this SceneGraph belongs to
     */
    constructor(viewport, scene) {
        super(viewport, scene);
        this.nodeList = new Array();
    }
    // @override
    addNodeSpecific(node, id) {
        this.nodeList.push(node);
    }
    // @override
    removeNodeSpecific(node, id) {
        let index = this.nodeList.indexOf(node);
        if (index > -1) {
            this.nodeList.splice(index, 1);
        }
    }
    // @override
    getNodesAtCoords(x, y) {
        let results = [];
        for (let node of this.nodeList) {
            if (node.contains(x, y)) {
                results.push(node);
            }
        }
        return results;
    }
    // @override
    getNodesInRegion(boundary) {
        let t0 = performance.now();
        let results = [];
        for (let node of this.nodeList) {
            if (boundary.overlaps(node.boundary)) {
                results.push(node);
            }
        }
        let t1 = performance.now();
        Stats_1.default.log("sgquery", (t1 - t0));
        return results;
    }
    update(deltaT) {
        let t0 = performance.now();
        for (let node of this.nodeList) {
            if (!node.getLayer().isPaused()) {
                node.update(deltaT);
            }
        }
        let t1 = performance.now();
        Stats_1.default.log("sgupdate", (t1 - t0));
    }
    render(ctx) { }
    // @override
    getVisibleSet() {
        let visibleSet = new Array();
        for (let node of this.nodeList) {
            if (!node.getLayer().isHidden() && node.visible && this.viewport.includes(node)) {
                visibleSet.push(node);
            }
        }
        return visibleSet;
    }
}
exports.default = SceneGraphArray;
},{"../Debug/Stats":25,"./SceneGraph":89}],91:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const MathUtils_1 = __importDefault(require("../Utils/MathUtils"));
const Queue_1 = __importDefault(require("../DataTypes/Collections/Queue"));
const AABB_1 = __importDefault(require("../DataTypes/Shapes/AABB"));
const Input_1 = __importDefault(require("../Input/Input"));
const ParallaxLayer_1 = __importDefault(require("../Scene/Layers/ParallaxLayer"));
const UILayer_1 = __importDefault(require("../Scene/Layers/UILayer"));
/**
 * The viewport of the game. Corresponds to the visible window displayed in the browser.
 * The viewport keeps track of its position in the game world, and can act as a camera to follow objects.
 */
class Viewport {
    constructor(canvasSize, zoomLevel) {
        /** The amount that is zoomed in or out. */
        this.ZOOM_FACTOR = 1.2;
        this.view = new AABB_1.default(Vec2_1.default.ZERO, Vec2_1.default.ZERO);
        this.boundary = new AABB_1.default(Vec2_1.default.ZERO, Vec2_1.default.ZERO);
        this.lastPositions = new Queue_1.default();
        this.smoothingFactor = 10;
        this.scrollZoomEnabled = false;
        this.canvasSize = Vec2_1.default.ZERO;
        this.focus = Vec2_1.default.ZERO;
        // Set the size of the canvas
        this.setCanvasSize(canvasSize);
        // Set the size of the viewport
        this.setSize(canvasSize);
        this.setZoomLevel(zoomLevel);
        // Set the center (and make the viewport stay there)
        this.setCenter(this.view.halfSize.clone());
        this.setFocus(this.view.halfSize.clone());
    }
    /** Enables the viewport to zoom in and out */
    enableZoom() {
        this.scrollZoomEnabled = true;
    }
    /**
     * Returns the position of the viewport
     * @returns The center of the viewport as a Vec2
     */
    getCenter() {
        return this.view.center;
    }
    /**
     * Returns a new Vec2 with the origin of the viewport
     * @returns The top left cornder of the Vieport as a Vec2
     */
    getOrigin() {
        return new Vec2_1.default(this.view.left, this.view.top);
    }
    /**
     * Returns the region visible to this viewport
     * @returns The AABB containing the region visible to the viewport
     */
    getView() {
        return this.view;
    }
    /**
     * Set the position of the viewport
     * @param vecOrX The new position or the x-coordinate of the new position
     * @param y The y-coordinate of the new position
     */
    setCenter(vecOrX, y = null) {
        let pos;
        if (vecOrX instanceof Vec2_1.default) {
            pos = vecOrX;
        }
        else {
            pos = new Vec2_1.default(vecOrX, y);
        }
        this.view.center = pos;
    }
    /**
     * Returns the size of the viewport as a Vec2
     * @returns The half-size of the viewport as a Vec2
     */
    getHalfSize() {
        return this.view.getHalfSize();
    }
    /**
     * Sets the size of the viewport
     * @param vecOrX The new width of the viewport or the new size as a Vec2
     * @param y The new height of the viewport
     */
    setSize(vecOrX, y = null) {
        if (vecOrX instanceof Vec2_1.default) {
            this.view.setHalfSize(vecOrX.scaled(1 / 2));
        }
        else {
            this.view.setHalfSize(new Vec2_1.default(vecOrX / 2, y / 2));
        }
    }
    /**
     * Sets the half-size of the viewport
     * @param vecOrX The new half-width of the viewport or the new half-size as a Vec2
     * @param y The new height of the viewport
     */
    setHalfSize(vecOrX, y = null) {
        if (vecOrX instanceof Vec2_1.default) {
            this.view.setHalfSize(vecOrX.clone());
        }
        else {
            this.view.setHalfSize(new Vec2_1.default(vecOrX, y));
        }
    }
    /**
     * Updates the viewport with the size of the current Canvas
     * @param vecOrX The width of the canvas, or the canvas size as a Vec2
     * @param y The height of the canvas
     */
    setCanvasSize(vecOrX, y = null) {
        if (vecOrX instanceof Vec2_1.default) {
            this.canvasSize = vecOrX.clone();
        }
        else {
            this.canvasSize = new Vec2_1.default(vecOrX, y);
        }
    }
    /**
     * Sets the zoom level of the viewport
     * @param zoom The zoom level
     */
    setZoomLevel(zoom) {
        this.view.halfSize.copy(this.canvasSize.scaled(1 / zoom / 2));
    }
    /**
     * Gets the zoom level of the viewport
     * @returns The zoom level
     */
    getZoomLevel() {
        return this.canvasSize.x / this.view.hw / 2;
    }
    /**
     * Sets the smoothing factor for the viewport movement.
     * @param smoothingFactor The smoothing factor for the viewport
     */
    setSmoothingFactor(smoothingFactor) {
        if (smoothingFactor < 1)
            smoothingFactor = 1;
        this.smoothingFactor = smoothingFactor;
    }
    /**
     * Tells the viewport to focus on a point. Overidden by "following".
     * @param focus The point the  viewport should focus on
     */
    setFocus(focus) {
        this.focus.copy(focus);
    }
    /**
     * Returns true if the CanvasNode is inside of the viewport
     * @param node The node to check
     * @returns True if the node is currently visible in the viewport, false if not
     */
    includes(node) {
        let parallax = node.getLayer() instanceof ParallaxLayer_1.default || node.getLayer() instanceof UILayer_1.default ? node.getLayer().parallax : new Vec2_1.default(1, 1);
        let center = this.view.center.clone();
        this.view.center.mult(parallax);
        let overlaps = this.view.overlaps(node.boundary);
        this.view.center = center;
        return overlaps;
    }
    // TODO: Put some error handling on this for trying to make the bounds too small for the viewport
    // TODO: This should probably be done automatically, or should consider the aspect ratio or something
    /**
     * Sets the bounds of the viewport
     * @param lowerX The left edge of the viewport
     * @param lowerY The top edge of the viewport
     * @param upperX The right edge of the viewport
     * @param upperY The bottom edge of the viewport
     */
    setBounds(lowerX, lowerY, upperX, upperY) {
        let hwidth = (upperX - lowerX) / 2;
        let hheight = (upperY - lowerY) / 2;
        let x = lowerX + hwidth;
        let y = lowerY + hheight;
        this.boundary.center.set(x, y);
        this.boundary.halfSize.set(hwidth, hheight);
    }
    /**
     * Make the viewport follow the specified GameNode
     * @param node The GameNode to follow
     */
    follow(node) {
        this.following = node;
    }
    updateView() {
        if (this.lastPositions.getSize() > this.smoothingFactor) {
            this.lastPositions.dequeue();
        }
        // Get the average of the last 10 positions
        let pos = Vec2_1.default.ZERO;
        this.lastPositions.forEach(position => pos.add(position));
        pos.scale(1 / this.lastPositions.getSize());
        // Set this position either to the object or to its bounds
        pos.x = MathUtils_1.default.clamp(pos.x, this.boundary.left + this.view.hw, this.boundary.right - this.view.hw);
        pos.y = MathUtils_1.default.clamp(pos.y, this.boundary.top + this.view.hh, this.boundary.bottom - this.view.hh);
        // Assure there are no lines in the tilemap
        pos.x = Math.floor(pos.x);
        pos.y = Math.floor(pos.y);
        this.view.center.copy(pos);
    }
    update(deltaT) {
        // If zoom is enabled
        if (this.scrollZoomEnabled) {
            if (Input_1.default.didJustScroll()) {
                let currentSize = this.view.getHalfSize().clone();
                if (Input_1.default.getScrollDirection() < 0) {
                    // Zoom in
                    currentSize.scale(1 / this.ZOOM_FACTOR);
                }
                else {
                    // Zoom out
                    currentSize.scale(this.ZOOM_FACTOR);
                }
                if (currentSize.x > this.boundary.hw) {
                    let factor = this.boundary.hw / currentSize.x;
                    currentSize.x = this.boundary.hw;
                    currentSize.y *= factor;
                }
                if (currentSize.y > this.boundary.hh) {
                    let factor = this.boundary.hh / currentSize.y;
                    currentSize.y = this.boundary.hh;
                    currentSize.x *= factor;
                }
                this.view.setHalfSize(currentSize);
            }
        }
        // If viewport is following an object
        if (this.following) {
            // Update our list of previous positions
            this.lastPositions.enqueue(this.following.position.clone());
        }
        else {
            this.lastPositions.enqueue(this.focus);
        }
        this.updateView();
    }
}
exports.default = Viewport;
},{"../DataTypes/Collections/Queue":6,"../DataTypes/Shapes/AABB":17,"../DataTypes/Vec2":23,"../Input/Input":31,"../Scene/Layers/ParallaxLayer":96,"../Scene/Layers/UILayer":97,"../Utils/MathUtils":107}],92:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sprite_1 = __importDefault(require("../../Nodes/Sprites/Sprite"));
const GraphicTypes_1 = require("../../Nodes/Graphics/GraphicTypes");
const UIElementTypes_1 = require("../../Nodes/UIElements/UIElementTypes");
const Point_1 = __importDefault(require("../../Nodes/Graphics/Point"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const Button_1 = __importDefault(require("../../Nodes/UIElements/Button"));
const Label_1 = __importDefault(require("../../Nodes/UIElements/Label"));
const Slider_1 = __importDefault(require("../../Nodes/UIElements/Slider"));
const TextInput_1 = __importDefault(require("../../Nodes/UIElements/TextInput"));
const Rect_1 = __importDefault(require("../../Nodes/Graphics/Rect"));
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const Line_1 = __importDefault(require("../../Nodes/Graphics/Line"));
const Particle_1 = __importDefault(require("../../Nodes/Graphics/Particle"));
const LightMask_1 = __importDefault(require("../../../hw4/Custom/LightMask"));
// @ignorePage
/**
 * A factory that abstracts adding @reference[CanvasNode]s to the @reference[Scene].
 * Access methods in this factory through Scene.add.[methodName]().
 */
class CanvasNodeFactory {
    constructor() {
        /**
         * Adds an instance of a UIElement to the current scene - i.e. any class that extends UIElement
         * @param type The type of UIElement to add
         * @param layerName The layer to add the UIElement to
         * @param options Any additional arguments to feed to the constructor
         * @returns A new UIElement
         */
        this.addUIElement = (type, layerName, options) => {
            // Get the layer
            let layer = this.scene.getLayer(layerName);
            let instance;
            switch (type) {
                case UIElementTypes_1.UIElementType.BUTTON:
                    instance = this.buildButton(options);
                    break;
                case UIElementTypes_1.UIElementType.LABEL:
                    instance = this.buildLabel(options);
                    break;
                case UIElementTypes_1.UIElementType.SLIDER:
                    instance = this.buildSlider(options);
                    break;
                case UIElementTypes_1.UIElementType.TEXT_INPUT:
                    instance = this.buildTextInput(options);
                    break;
                default:
                    throw `UIElementType '${type}' does not exist, or is registered incorrectly.`;
            }
            instance.setScene(this.scene);
            instance.id = this.scene.generateId();
            this.scene.getSceneGraph().addNode(instance);
            // Add instance to layer
            layer.addNode(instance);
            return instance;
        };
        /**
         * Adds a sprite to the current scene
         * @param key The key of the image the sprite will represent
         * @param layerName The layer on which to add the sprite
         * @returns A new Sprite
         */
        this.addSprite = (key, layerName) => {
            let layer = this.scene.getLayer(layerName);
            let instance = new Sprite_1.default(key);
            // Add instance to scene
            instance.setScene(this.scene);
            instance.id = this.scene.generateId();
            if (!(this.scene.isParallaxLayer(layerName) || this.scene.isUILayer(layerName))) {
                this.scene.getSceneGraph().addNode(instance);
            }
            // Add instance to layer
            layer.addNode(instance);
            return instance;
        };
        /**
         * Adds an AnimatedSprite to the current scene
         * @param key The key of the image the sprite will represent
         * @param layerName The layer on which to add the sprite
         * @returns A new AnimatedSprite
         */
        this.addAnimatedSprite = (constr, key, layerName) => {
            let layer = this.scene.getLayer(layerName);
            let spritesheet = this.resourceManager.getSpritesheet(key);
            let instance = new constr(spritesheet);
            // Add instance fo scene
            instance.setScene(this.scene);
            instance.id = this.scene.generateId();
            if (!(this.scene.isParallaxLayer(layerName) || this.scene.isUILayer(layerName))) {
                this.scene.getSceneGraph().addNode(instance);
            }
            // Add instance to layer
            layer.addNode(instance);
            return instance;
        };
        /**
         * Adds a new graphic element to the current Scene
         * @param type The type of graphic to add
         * @param layerName The layer on which to add the graphic
         * @param options Any additional arguments to send to the graphic constructor
         * @returns A new Graphic
         */
        this.addGraphic = (type, layerName, options) => {
            // Get the layer
            let layer = this.scene.getLayer(layerName);
            let instance;
            switch (type) {
                case GraphicTypes_1.GraphicType.POINT:
                    instance = this.buildPoint(options);
                    break;
                case GraphicTypes_1.GraphicType.LINE:
                    instance = this.buildLine(options);
                    break;
                case GraphicTypes_1.GraphicType.RECT:
                    instance = this.buildRect(options);
                    break;
                case GraphicTypes_1.GraphicType.PARTICLE:
                    instance = this.buildParticle(options);
                    break;
                case GraphicTypes_1.GraphicType.LIGHT_MASK:
                    instance = new LightMask_1.default();
                    break;
                default:
                    throw `GraphicType '${type}' does not exist, or is registered incorrectly.`;
            }
            // Add instance to scene
            instance.setScene(this.scene);
            instance.id = this.scene.generateId();
            if (!(this.scene.isParallaxLayer(layerName) || this.scene.isUILayer(layerName))) {
                this.scene.getSceneGraph().addNode(instance);
            }
            // Add instance to layer
            layer.addNode(instance);
            return instance;
        };
    }
    init(scene) {
        this.scene = scene;
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
    /* ---------- BUILDERS ---------- */
    buildButton(options) {
        this.checkIfPropExists("Button", options, "position", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Button", options, "text", "string");
        return new Button_1.default(options.position, options.text);
    }
    buildLabel(options) {
        this.checkIfPropExists("Label", options, "position", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Label", options, "text", "string");
        return new Label_1.default(options.position, options.text);
    }
    buildSlider(options) {
        this.checkIfPropExists("Slider", options, "position", Vec2_1.default, "Vec2");
        let initValue = 0;
        if (options.value !== undefined) {
            initValue = options.value;
        }
        return new Slider_1.default(options.position, initValue);
    }
    buildTextInput(options) {
        this.checkIfPropExists("TextInput", options, "position", Vec2_1.default, "Vec2");
        return new TextInput_1.default(options.position);
    }
    buildPoint(options) {
        this.checkIfPropExists("Point", options, "position", Vec2_1.default, "Vec2");
        return new Point_1.default(options.position);
    }
    buildParticle(options) {
        this.checkIfPropExists("Particle", options, "position", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Particle", options, "size", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Particle", options, "mass", "number", "number");
        //Changed for testing
        return new Particle_1.default(options.position, options.size, options.mass);
    }
    buildLine(options) {
        this.checkIfPropExists("Line", options, "start", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Line", options, "end", Vec2_1.default, "Vec2");
        return new Line_1.default(options.start, options.end);
    }
    buildRect(options) {
        this.checkIfPropExists("Rect", options, "position", Vec2_1.default, "Vec2");
        this.checkIfPropExists("Rect", options, "size", Vec2_1.default, "Vec2");
        return new Rect_1.default(options.position, options.size);
    }
    /* ---------- ERROR HANDLING ---------- */
    checkIfPropExists(objectName, options, prop, type, typeName) {
        if (!options || options[prop] === undefined) {
            // Check that the options object has the property
            throw `${objectName} object requires argument ${prop} of type ${typeName}, but none was provided.`;
        }
        else {
            // Check that the property has the correct type
            if ((typeof type) === "string") {
                if (!(typeof options[prop] === type)) {
                    throw `${objectName} object requires argument ${prop} of type ${type}, but provided ${prop} was not of type ${type}.`;
                }
            }
            else if (type instanceof Function) {
                // If type is a constructor, check against that
                if (!(options[prop] instanceof type)) {
                    throw `${objectName} object requires argument ${prop} of type ${typeName}, but provided ${prop} was not of type ${typeName}.`;
                }
            }
            else {
                throw `${objectName} object requires argument ${prop} of type ${typeName}, but provided ${prop} was not of type ${typeName}.`;
            }
        }
    }
}
exports.default = CanvasNodeFactory;
},{"../../../hw4/Custom/LightMask":122,"../../DataTypes/Vec2":23,"../../Nodes/Graphics/GraphicTypes":41,"../../Nodes/Graphics/Line":42,"../../Nodes/Graphics/Particle":43,"../../Nodes/Graphics/Point":44,"../../Nodes/Graphics/Rect":45,"../../Nodes/Sprites/Sprite":47,"../../Nodes/UIElements/Button":53,"../../Nodes/UIElements/Label":54,"../../Nodes/UIElements/Slider":55,"../../Nodes/UIElements/TextInput":56,"../../Nodes/UIElements/UIElementTypes":57,"../../ResourceManager/ResourceManager":88}],93:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CanvasNodeFactory_1 = __importDefault(require("./CanvasNodeFactory"));
const TilemapFactory_1 = __importDefault(require("./TilemapFactory"));
/**
 * The manager of all factories used for adding @reference[GameNode]s to the @reference[Scene].
 */
class FactoryManager {
    constructor(scene, tilemaps) {
        // Constructors are called here to allow assignment of their functions to functions in this class
        this.canvasNodeFactory = new CanvasNodeFactory_1.default();
        this.tilemapFactory = new TilemapFactory_1.default();
        this.canvasNodeFactory.init(scene);
        this.tilemapFactory.init(scene, tilemaps);
    }
    // Expose all of the factories through the factory manager
    /**
     * Adds an instance of a UIElement to the current scene - i.e. any class that extends UIElement
     * @param type The type of UIElement to add
     * @param layerName The layer to add the UIElement to
     * @param options Any additional arguments to feed to the constructor
     * @returns A new UIElement
     */
    uiElement(type, layerName, options) {
        return this.canvasNodeFactory.addUIElement(type, layerName, options);
    }
    /**
     * Adds a sprite to the current scene
     * @param key The key of the image the sprite will represent
     * @param layerName The layer on which to add the sprite
     * @returns A new Sprite
     */
    sprite(key, layerName) {
        return this.canvasNodeFactory.addSprite(key, layerName);
    }
    /**
     * Adds an AnimatedSprite to the current scene
     * @param key The key of the image the sprite will represent
     * @param layerName The layer on which to add the sprite
     * @returns A new AnimatedSprite
     */
    animatedSprite(constr, key, layerName) {
        return this.canvasNodeFactory.addAnimatedSprite(constr, key, layerName);
    }
    /**
     * Adds a new graphic element to the current Scene
     * @param type The type of graphic to add
     * @param layerName The layer on which to add the graphic
     * @param options Any additional arguments to send to the graphic constructor
     * @returns A new Graphic
     */
    graphic(type, layerName, options) {
        return this.canvasNodeFactory.addGraphic(type, layerName, options);
    }
    /**
     * Adds a tilemap to the scene
     * @param key The key of the loaded tilemap to load
     * @param constr The constructor of the desired tilemap
     * @param args Additional arguments to send to the tilemap constructor
     * @returns An array of Layers, each of which contains a layer of the tilemap as its own Tilemap instance.
     */
    tilemap(key, scale) {
        return this.tilemapFactory.add(key, scale);
    }
    /**
     * Adds a new LightMask element to the current Scene
     * @param layerName The layer on which to add the LightMask
     * @returns A new LightMask
     */
    lightMask(layerName) {
        return this.canvasNodeFactory.addGraphic("LIGHT_MASK", layerName);
    }
}
exports.default = FactoryManager;
},{"./CanvasNodeFactory":92,"./TilemapFactory":94}],94:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TilemapOrientation = void 0;
const ResourceManager_1 = __importDefault(require("../../ResourceManager/ResourceManager"));
const OrthogonalTilemap_1 = __importDefault(require("../../Nodes/Tilemaps/OrthogonalTilemap"));
const Tileset_1 = __importDefault(require("../../DataTypes/Tilesets/Tileset"));
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const PositionGraph_1 = __importDefault(require("../../DataTypes/Graphs/PositionGraph"));
const Navmesh_1 = __importDefault(require("../../Pathfinding/Navmesh"));
const IsometricTilemap_1 = __importDefault(require("../../Nodes/Tilemaps/IsometricTilemap"));
const StaggeredIsometricTilemap_1 = __importDefault(require("../../Nodes/Tilemaps/StaggeredIsometricTilemap"));
// @ignorePage
var TilemapOrientation;
(function (TilemapOrientation) {
    TilemapOrientation["ORTHOGONAL"] = "orthogonal";
    TilemapOrientation["ISOMETRIC"] = "isometric";
    TilemapOrientation["STAGGERED_ISOMETRIC"] = "staggered";
})(TilemapOrientation = exports.TilemapOrientation || (exports.TilemapOrientation = {}));
/**
 * A factory that abstracts adding @reference[Tilemap]s to the @reference[Scene].
 * Access methods in this factory through Scene.add.[methodName]().
 */
class TilemapFactory {
    constructor() {
        // TODO - This is specifically catered to Tiled tilemaps right now. In the future,
        // it would be good to have a "parseTilemap" function that would convert the tilemap
        // data into a standard format. This could allow for support from other programs
        // or the development of an internal level builder tool
        /**
         * Adds a tilemap to the scene
         * @param key The key of the loaded tilemap to load
         * @param constr The constructor of the desired tilemap
         * @param args Additional arguments to send to the tilemap constructor
         * @returns An array of Layers, each of which contains a layer of the tilemap as its own Tilemap instance.
         */
        this.add = (key, scale = new Vec2_1.default(1, 1)) => {
            // Get Tilemap Data
            let tilemapData = this.resourceManager.getTilemap(key);
            // Set the constructor for this tilemap to either be orthographic or isometric
            let constr;
            switch (tilemapData.orientation) {
                case TilemapOrientation.ORTHOGONAL: {
                    constr = OrthogonalTilemap_1.default;
                    break;
                }
                case TilemapOrientation.ISOMETRIC: {
                    constr = IsometricTilemap_1.default;
                    break;
                }
                case TilemapOrientation.STAGGERED_ISOMETRIC: {
                    constr = StaggeredIsometricTilemap_1.default;
                    break;
                }
                default: {
                    throw new Error(`Unknown Tilemap Orientation "${tilemapData.orientation}"`);
                }
            }
            // Initialize the return value array
            let sceneLayers = new Array();
            // Create all of the tilesets for this tilemap
            let tilesets = new Array();
            let collectionTiles = new Array();
            for (let tileset of tilemapData.tilesets) {
                console.log(tileset.image);
                if (tileset.image) {
                    // If this is a standard tileset and not a collection, create a tileset for it.
                    // TODO - We are ignoring collection tilesets for now. This is likely not a great idea in practice,
                    // as theoretically someone could want to use one for a standard tilemap. We are assuming for now
                    // that we only want to use them for object layers
                    tilesets.push(new Tileset_1.default(tileset));
                }
                else {
                    console.log("IM HERE: " + tileset.tiles);
                    tileset.tiles.forEach(tile => tile.id += tileset.firstgid);
                    collectionTiles.push(...tileset.tiles);
                }
            }
            // Loop over the layers of the tilemap and create tiledlayers or object layers
            for (let layer of tilemapData.layers) {
                let sceneLayer;
                let isParallaxLayer = false;
                let depth = 0;
                if (layer.properties) {
                    for (let prop of layer.properties) {
                        if (prop.name === "Parallax") {
                            isParallaxLayer = prop.value;
                        }
                        else if (prop.name === "Depth") {
                            depth = prop.value;
                        }
                    }
                }
                if (isParallaxLayer) {
                    sceneLayer = this.scene.addParallaxLayer(layer.name, new Vec2_1.default(1, 1), depth);
                }
                else {
                    sceneLayer = this.scene.addLayer(layer.name, depth);
                }
                if (layer.type === "tilelayer") {
                    // Create a new tilemap object for the layer
                    let tilemap = new constr(tilemapData, layer, tilesets, scale);
                    tilemap.id = this.scene.generateId();
                    tilemap.setScene(this.scene);
                    // Add tilemap to scene
                    this.tilemaps.push(tilemap);
                    sceneLayer.addNode(tilemap);
                    // Register tilemap with physics if it's collidable
                    if (tilemap.isCollidable) {
                        tilemap.addPhysics();
                        if (layer.properties) {
                            for (let item of layer.properties) {
                                if (item.name === "Group") {
                                    tilemap.setGroup(item.value);
                                }
                            }
                        }
                    }
                }
                else {
                    let isNavmeshPoints = false;
                    let navmeshName;
                    let edges;
                    if (layer.properties) {
                        for (let prop of layer.properties) {
                            if (prop.name === "NavmeshPoints") {
                                isNavmeshPoints = true;
                            }
                            else if (prop.name === "name") {
                                navmeshName = prop.value;
                            }
                            else if (prop.name === "edges") {
                                edges = prop.value;
                            }
                        }
                    }
                    if (isNavmeshPoints) {
                        let g = new PositionGraph_1.default();
                        for (let obj of layer.objects) {
                            g.addPositionedNode(new Vec2_1.default(obj.x, obj.y));
                        }
                        for (let edge of edges) {
                            g.addEdge(edge.from, edge.to);
                        }
                        this.scene.getNavigationManager().addNavigableEntity(navmeshName, new Navmesh_1.default(g));
                        continue;
                    }
                    // Layer is an object layer, so add each object as a sprite to a new layer
                    for (let obj of layer.objects) {
                        // Check if obj is collidable
                        let hasPhysics = false;
                        let isCollidable = false;
                        let isTrigger = false;
                        let onEnter = null;
                        let onExit = null;
                        let triggerGroup = null;
                        let group = "";
                        if (obj.properties) {
                            for (let prop of obj.properties) {
                                if (prop.name === "HasPhysics") {
                                    hasPhysics = prop.value;
                                }
                                else if (prop.name === "Collidable") {
                                    isCollidable = prop.value;
                                }
                                else if (prop.name === "Group") {
                                    group = prop.value;
                                }
                                else if (prop.name === "IsTrigger") {
                                    isTrigger = prop.value;
                                }
                                else if (prop.name === "TriggerGroup") {
                                    triggerGroup = prop.value;
                                }
                                else if (prop.name === "TriggerOnEnter") {
                                    onEnter = prop.value;
                                }
                                else if (prop.name === "TriggerOnExit") {
                                    onExit = prop.value;
                                }
                            }
                        }
                        let sprite;
                        // Check if obj is a tile from a tileset
                        for (let tileset of tilesets) {
                            if (tileset.hasTile(obj.gid)) {
                                // The object is a tile from this set
                                let imageKey = tileset.getImageKey();
                                let offset = tileset.getImageOffsetForTile(obj.gid);
                                sprite = this.scene.add.sprite(imageKey, layer.name);
                                let size = tileset.getTileSize().clone();
                                sprite.position.set((obj.x + size.x / 2) * scale.x, (obj.y - size.y / 2) * scale.y);
                                sprite.setImageOffset(offset);
                                sprite.size.copy(size);
                                sprite.scale.set(scale.x, scale.y);
                            }
                        }
                        // Not in a tileset, must correspond to a collection
                        if (!sprite) {
                            for (let tile of collectionTiles) {
                                if (obj.gid === tile.id) {
                                    let imageKey = tile.image;
                                    sprite = this.scene.add.sprite(imageKey, layer.name);
                                    sprite.position.set((obj.x + tile.imagewidth / 2) * scale.x, (obj.y - tile.imageheight / 2) * scale.y);
                                    sprite.scale.set(scale.x, scale.y);
                                }
                            }
                        }
                        // Now we have sprite. Associate it with our physics object if there is one
                        if (hasPhysics) {
                            // Make the sprite a static physics object
                            sprite.addPhysics(sprite.boundary.clone(), Vec2_1.default.ZERO, isCollidable, true);
                            sprite.setGroup(group);
                            if (isTrigger && triggerGroup !== null) {
                                sprite.setTrigger(triggerGroup, onEnter, onExit);
                            }
                        }
                    }
                }
                // Update the return value
                sceneLayers.push(sceneLayer);
            }
            return sceneLayers;
        };
    }
    init(scene, tilemaps) {
        this.scene = scene;
        this.tilemaps = tilemaps;
        this.resourceManager = ResourceManager_1.default.getInstance();
    }
}
exports.default = TilemapFactory;
},{"../../DataTypes/Graphs/PositionGraph":11,"../../DataTypes/Tilesets/Tileset":22,"../../DataTypes/Vec2":23,"../../Nodes/Tilemaps/IsometricTilemap":49,"../../Nodes/Tilemaps/OrthogonalTilemap":50,"../../Nodes/Tilemaps/StaggeredIsometricTilemap":51,"../../Pathfinding/Navmesh":60,"../../ResourceManager/ResourceManager":88}],95:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("../Utils/MathUtils"));
/**
 * A layer in the scene. Layers are used for sorting @reference[GameNode]s by depth.
 */
class Layer {
    /**
     * Creates a new layer. To do this in a game, use the addLayer() method in @refrence[Scene]
     * @param scene The scene to add the layer to
     * @param name The name of the layer
     */
    constructor(scene, name) {
        this.scene = scene;
        this.name = name;
        this.paused = false;
        this.hidden = false;
        this.alpha = 1;
        this.items = new Array();
        this.ySort = false;
        this.depth = 0;
    }
    /**
     * Retreives the name of the layer
     * @returns The name of the layer
     */
    getName() {
        return this.name;
    }
    /**
     * Pauses/Unpauses the layer. Affects all elements in this layer
     * @param pauseValue True if the layer should be paused, false if not
     */
    setPaused(pauseValue) {
        this.paused = pauseValue;
    }
    /**
     * Returns whether or not the layer is paused
     */
    isPaused() {
        return this.paused;
    }
    /**
     * Sets the opacity of the layer
     * @param alpha The new opacity value in the range [0, 1]
     */
    setAlpha(alpha) {
        this.alpha = MathUtils_1.default.clamp(alpha, 0, 1);
    }
    /**
     * Gets the opacity of the layer
     * @returns The opacity
     */
    getAlpha() {
        return this.alpha;
    }
    /**
     * Sets the layer's hidden value. If hidden, a layer will not be rendered, but will still update
     * @param hidden The hidden value of the layer
     */
    setHidden(hidden) {
        this.hidden = hidden;
    }
    /**
     * Returns the hideen value of the lyaer
     * @returns True if the scene is hidden, false otherwise
     */
    isHidden() {
        return this.hidden;
    }
    /** Pauses this scene and hides it */
    disable() {
        this.paused = true;
        this.hidden = true;
    }
    /** Unpauses this layer and makes it visible */
    enable() {
        this.paused = false;
        this.hidden = false;
    }
    /**
     * Sets whether or not the scene will ySort automatically.
     * ySorting means that CanvasNodes on this layer will have their depth sorted depending on their y-value.
     * This means that if an object is "higher" in the scene, it will sort behind objects that are "lower".
     * This is useful for 3/4 view games, or similar situations, where you sometimes want to be in front of objects,
     * and other times want to be behind the same objects.
     * @param ySort True if ySorting should be active, false if not
     */
    setYSort(ySort) {
        this.ySort = ySort;
    }
    /**
     * Gets the ySort status of the scene
     * @returns True if ySorting is occurring, false otherwise
     */
    getYSort() {
        return this.ySort;
    }
    /**
     * Sets the depth of the layer compared to other layers. A larger number means the layer will be closer to the screen.
     * @param depth The depth of the layer.
     */
    setDepth(depth) {
        this.depth = depth;
    }
    /**
     * Retrieves the depth of the layer.
     * @returns The depth
     */
    getDepth() {
        return this.depth;
    }
    /**
     * Adds a node to this layer
     * @param node The node to add to this layer.
     */
    addNode(node) {
        this.items.push(node);
        node.setLayer(this);
    }
    /**
     * Removes a node from this layer
     * @param node The node to remove
     * @returns true if the node was removed, false otherwise
     */
    removeNode(node) {
        // Find and remove the node
        let index = this.items.indexOf(node);
        if (index !== -1) {
            this.items.splice(index, 1);
            node.setLayer(undefined);
        }
    }
    /**
     * Retreives all GameNodes from this layer
     * @returns an Array that contains all of the GameNodes in this layer.
     */
    getItems() {
        return this.items;
    }
}
exports.default = Layer;
},{"../Utils/MathUtils":107}],96:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Layer_1 = __importDefault(require("../Layer"));
/**
 * An extension of a Layer that has a parallax value.
 */
class ParallaxLayer extends Layer_1.default {
    /**
     * Creates a new ParallaxLayer.
     * Use addParallaxLayer() in @reference[Scene] to add a layer of this type to your game.
     * @param scene The Scene to add this ParallaxLayer to
     * @param name The name of the ParallaxLayer
     * @param parallax The parallax level
     */
    constructor(scene, name, parallax) {
        super(scene, name);
        this.parallax = parallax;
    }
}
exports.default = ParallaxLayer;
},{"../Layer":95}],97:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../DataTypes/Vec2"));
const ParallaxLayer_1 = __importDefault(require("./ParallaxLayer"));
/**
 * A Layer strictly to be used for managing UIElements.
 * This is intended to be a Layer that always stays in the same place,
 * and thus renders things like a HUD or an inventory without taking into consideration the \reference[Viewport] scroll.
 */
class UILayer extends ParallaxLayer_1.default {
    /**
     * Creates a new UILayer.
     * Use addUILayer() in @reference[Scene] to add a layer of this type to your game.
     * @param scene The Scene to add this UILayer to
     * @param name The name of the UILayer
     */
    constructor(scene, name) {
        super(scene, name, Vec2_1.default.ZERO);
    }
}
exports.default = UILayer;
},{"../../DataTypes/Vec2":23,"./ParallaxLayer":96}],98:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Layer_1 = __importDefault(require("./Layer"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const BasicPhysicsManager_1 = __importDefault(require("../Physics/BasicPhysicsManager"));
const SceneGraphArray_1 = __importDefault(require("../SceneGraph/SceneGraphArray"));
const FactoryManager_1 = __importDefault(require("./Factories/FactoryManager"));
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const Emitter_1 = __importDefault(require("../Events/Emitter"));
const NavigationManager_1 = __importDefault(require("../Pathfinding/NavigationManager"));
const AIManager_1 = __importDefault(require("../AI/AIManager"));
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const ParallaxLayer_1 = __importDefault(require("./Layers/ParallaxLayer"));
const UILayer_1 = __importDefault(require("./Layers/UILayer"));
const CanvasNode_1 = __importDefault(require("../Nodes/CanvasNode"));
const SceneOptions_1 = __importDefault(require("./SceneOptions"));
const Debug_1 = __importDefault(require("../Debug/Debug"));
const TimerManager_1 = __importDefault(require("../Timing/TimerManager"));
const TweenManager_1 = __importDefault(require("../Rendering/Animations/TweenManager"));
const ParticleSystemManager_1 = __importDefault(require("../Rendering/Animations/ParticleSystemManager"));
/**
 * Scenes are the main container in the game engine.
 * Your main scene is the current level or menu of the game, and will contain all of the GameNodes needed.
 * Scenes provide an easy way to load assets, add assets to the game world, and unload assets,
 * and have lifecycle methods exposed for these functions.
 */
class Scene {
    /**
     * Creates a new Scene. To add a new Scene in your game, use changeToScene() in @reference[SceneManager]
     * @param viewport The viewport of the game
     * @param sceneManager The SceneManager that owns this Scene
     * @param renderingManager The RenderingManager that will handle this Scene's rendering
     * @param game The instance of the Game
     * @param options The options for Scene initialization
     */
    constructor(viewport, sceneManager, renderingManager, options) {
        this.sceneOptions = SceneOptions_1.default.parse(options === undefined ? {} : options);
        this.worldSize = new Vec2_1.default(500, 500);
        this.viewport = viewport;
        this.viewport.setBounds(0, 0, 2560, 1280);
        this.running = false;
        this.sceneManager = sceneManager;
        this.receiver = new Receiver_1.default();
        this.emitter = new Emitter_1.default();
        this.tilemaps = new Array();
        this.sceneGraph = new SceneGraphArray_1.default(this.viewport, this);
        this.layers = new Map_1.default();
        this.uiLayers = new Map_1.default();
        this.parallaxLayers = new Map_1.default();
        this.physicsManager = new BasicPhysicsManager_1.default(this.sceneOptions.physics);
        this.navManager = new NavigationManager_1.default();
        this.aiManager = new AIManager_1.default();
        this.renderingManager = renderingManager;
        this.add = new FactoryManager_1.default(this, this.tilemaps);
        this.load = ResourceManager_1.default.getInstance();
        this.resourceManager = this.load;
        // Get the timer manager and clear any existing timers
        TimerManager_1.default.getInstance().clearTimers();
    }
    /** A lifecycle method that gets called immediately after a new scene is created, before anything else. */
    initScene(init) { }
    /** A lifecycle method that gets called when a new scene is created. Load all files you wish to access in the scene here. */
    loadScene() { }
    /** A lifecycle method called strictly after loadScene(). Create any game objects you wish to use in the scene here. */
    startScene() { }
    /**
     * A lifecycle method called every frame of the game. This is where you can dynamically do things like add in new enemies
     * @param delta The time this frame represents
     */
    updateScene(deltaT) { }
    /** A lifecycle method that gets called on scene destruction. Specify which files you no longer need for garbage collection. */
    unloadScene() { }
    update(deltaT) {
        this.updateScene(deltaT);
        // Do time updates
        TimerManager_1.default.getInstance().update(deltaT);
        // Do all AI updates
        this.aiManager.update(deltaT);
        // Update all physics objects
        this.physicsManager.update(deltaT);
        // Update all canvas objects
        this.sceneGraph.update(deltaT);
        // Update all tilemaps
        this.tilemaps.forEach(tilemap => {
            if (!tilemap.getLayer().isPaused()) {
                tilemap.update(deltaT);
            }
        });
        // Update all tweens
        TweenManager_1.default.getInstance().update(deltaT);
        // Update all particle systems
        ParticleSystemManager_1.default.getInstance().update(deltaT);
        // Update viewport
        this.viewport.update(deltaT);
    }
    /**
     * Collects renderable sets and coordinates with the RenderingManager to draw the Scene
     */
    render() {
        // Get the visible set of nodes
        let visibleSet = this.sceneGraph.getVisibleSet();
        // Add parallax layer items to the visible set (we're rendering them all for now)
        this.parallaxLayers.forEach(key => {
            let pLayer = this.parallaxLayers.get(key);
            for (let node of pLayer.getItems()) {
                if (node instanceof CanvasNode_1.default) {
                    visibleSet.push(node);
                }
            }
        });
        // Send the visible set, tilemaps, and uiLayers to the renderer
        this.renderingManager.render(visibleSet, this.tilemaps, this.uiLayers);
        let nodes = this.sceneGraph.getAllNodes();
        this.tilemaps.forEach(tilemap => tilemap.visible ? nodes.push(tilemap) : 0);
        Debug_1.default.setNodes(nodes);
    }
    /**
     * Sets the scene as running or not
     * @param running True if the Scene should be running, false if not
     */
    setRunning(running) {
        this.running = running;
    }
    /**
     * Returns whether or not the Scene is running
     * @returns True if the scene is running, false otherwise
     */
    isRunning() {
        return this.running;
    }
    /**
     * Removes a node from this Scene
     * @param node The node to remove
     */
    remove(node) {
        // Remove from the scene graph
        if (node instanceof CanvasNode_1.default) {
            this.sceneGraph.removeNode(node);
        }
    }
    /** Destroys this scene and all nodes in it */
    destroy() {
        for (let node of this.sceneGraph.getAllNodes()) {
            node.destroy();
        }
        for (let tilemap of this.tilemaps) {
            tilemap.destroy();
        }
        this.receiver.destroy();
        delete this.sceneGraph;
        delete this.physicsManager;
        delete this.navManager;
        delete this.aiManager;
        delete this.receiver;
    }
    /**
     * Adds a new layer to the scene and returns it
     * @param name The name of the new layer
     * @param depth The depth of the layer
     * @returns The newly created Layer
     */
    addLayer(name, depth) {
        if (this.layers.has(name) || this.parallaxLayers.has(name) || this.uiLayers.has(name)) {
            throw `Layer with name ${name} already exists`;
        }
        let layer = new Layer_1.default(this, name);
        this.layers.add(name, layer);
        if (depth) {
            layer.setDepth(depth);
        }
        return layer;
    }
    /**
     * Adds a new parallax layer to this scene and returns it
     * @param name The name of the parallax layer
     * @param parallax The parallax level
     * @param depth The depth of the layer
     * @returns The newly created ParallaxLayer
     */
    addParallaxLayer(name, parallax, depth) {
        if (this.layers.has(name) || this.parallaxLayers.has(name) || this.uiLayers.has(name)) {
            throw `Layer with name ${name} already exists`;
        }
        let layer = new ParallaxLayer_1.default(this, name, parallax);
        this.parallaxLayers.add(name, layer);
        if (depth) {
            layer.setDepth(depth);
        }
        return layer;
    }
    /**
     * Adds a new UILayer to the scene
     * @param name The name of the new UIlayer
     * @returns The newly created UILayer
     */
    addUILayer(name) {
        if (this.layers.has(name) || this.parallaxLayers.has(name) || this.uiLayers.has(name)) {
            throw `Layer with name ${name} already exists`;
        }
        let layer = new UILayer_1.default(this, name);
        this.uiLayers.add(name, layer);
        return layer;
    }
    /**
     * Gets a layer from the scene by name if it exists.
     * This can be a Layer or any of its subclasses
     * @param name The name of the layer
     * @returns The Layer found with that name
     */
    getLayer(name) {
        if (this.layers.has(name)) {
            return this.layers.get(name);
        }
        else if (this.parallaxLayers.has(name)) {
            return this.parallaxLayers.get(name);
        }
        else if (this.uiLayers.has(name)) {
            return this.uiLayers.get(name);
        }
        else {
            throw `Requested layer ${name} does not exist.`;
        }
    }
    /**
     * Returns true if this layer is a ParallaxLayer
     * @param name The name of the layer
     * @returns True if this layer is a ParallaxLayer
     */
    isParallaxLayer(name) {
        return this.parallaxLayers.has(name);
    }
    /**
     * Returns true if this layer is a UILayer
     * @param name The name of the layer
     * @returns True if this layer is ParallaxLayer
     */
    isUILayer(name) {
        return this.uiLayers.has(name);
    }
    /**
     * Returns the translation of this node with respect to camera space (due to the viewport moving).
     * This value is affected by the parallax level of the @reference[Layer] the node is on.
     * @param node The node to check the viewport with respect to
     * @returns A Vec2 containing the translation of viewport with respect to this node.
     */
    getViewTranslation(node) {
        let layer = node.getLayer();
        if (layer instanceof ParallaxLayer_1.default || layer instanceof UILayer_1.default) {
            return this.viewport.getOrigin().mult(layer.parallax);
        }
        else {
            return this.viewport.getOrigin();
        }
    }
    /**
     * Returns the scale level of the view
     * @returns The zoom level of the viewport
    */
    getViewScale() {
        return this.viewport.getZoomLevel();
    }
    /**
     * Returns the Viewport associated with this scene
     * @returns The current Viewport
     */
    getViewport() {
        return this.viewport;
    }
    /**
     * Gets the world size of this Scene
     * @returns The world size in a Vec2
     */
    getWorldSize() {
        return this.worldSize;
    }
    /**
     * Gets the SceneGraph associated with this Scene
     * @returns The SceneGraph
     */
    getSceneGraph() {
        return this.sceneGraph;
    }
    /**
     * Gets the PhysicsManager associated with this Scene
     * @returns The PhysicsManager
     */
    getPhysicsManager() {
        return this.physicsManager;
    }
    /**
     * Gets the NavigationManager associated with this Scene
     * @returns The NavigationManager
     */
    getNavigationManager() {
        return this.navManager;
    }
    /**
     * Gets the AIManager associated with this Scene
     * @returns The AIManager
     */
    getAIManager() {
        return this.aiManager;
    }
    /**
     * Generates an ID for a GameNode
     * @returns The new ID
     */
    generateId() {
        return this.sceneManager.generateId();
    }
    /**
     * Retrieves a Tilemap in this Scene
     * @param name The name of the Tilemap
     * @returns The Tilemap, if one this name exists, otherwise null
     */
    getTilemap(name) {
        for (let tilemap of this.tilemaps) {
            if (tilemap.name === name) {
                return tilemap;
            }
        }
        return null;
    }
}
exports.default = Scene;
},{"../AI/AIManager":2,"../DataTypes/Collections/Map":5,"../DataTypes/Vec2":23,"../Debug/Debug":24,"../Events/Emitter":26,"../Events/Receiver":30,"../Nodes/CanvasNode":38,"../Pathfinding/NavigationManager":58,"../Physics/BasicPhysicsManager":63,"../Rendering/Animations/ParticleSystemManager":72,"../Rendering/Animations/TweenManager":74,"../ResourceManager/ResourceManager":88,"../SceneGraph/SceneGraphArray":90,"../Timing/TimerManager":103,"./Factories/FactoryManager":93,"./Layer":95,"./Layers/ParallaxLayer":96,"./Layers/UILayer":97,"./SceneOptions":100}],99:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const GameEventType_1 = require("../Events/GameEventType");
/**
 * The SceneManager acts as an interface to create Scenes, and handles the lifecycle methods of Scenes.
 * It gives Scenes access to information they need from the @reference[Game] class while keeping a layer of separation.
 */
class SceneManager {
    /**
     * Creates a new SceneManager
     * @param viewport The Viewport of the game
     * @param game The Game instance
     * @param renderingManager The RenderingManager of the game
     */
    constructor(viewport, renderingManager) {
        this.resourceManager = ResourceManager_1.default.getInstance();
        this.viewport = viewport;
        this.renderingManager = renderingManager;
        this.idCounter = 0;
        this.pendingScene = null;
        this.receiver = new Receiver_1.default();
        this.receiver.subscribe(GameEventType_1.GameEventType.CHANGE_SCENE);
    }
    /**
     * Add a scene as the main scene.
     * Use this method if you've created a subclass of Scene, and you want to add it as the main Scene.
     * @param constr The constructor of the scene to add
     * @param init An object to pass to the init function of the new scene
     */
    changeToScene(constr, init, options) {
        console.log("Creating the new scene - change is pending until next update");
        this.pendingScene = new constr(this.viewport, this, this.renderingManager, options);
        this.pendingSceneInit = init;
    }
    doSceneChange() {
        console.log("Performing scene change");
        this.viewport.setCenter(this.viewport.getHalfSize().x, this.viewport.getHalfSize().y);
        if (this.currentScene) {
            console.log("Unloading old scene");
            this.currentScene.unloadScene();
            console.log("Destroying old scene");
            this.currentScene.destroy();
        }
        console.log("Unloading old resources...");
        this.resourceManager.unloadAllResources();
        // Make the pending scene the current one
        this.currentScene = this.pendingScene;
        // Make the pending scene null
        this.pendingScene = null;
        // Init the scene
        this.currentScene.initScene(this.pendingSceneInit);
        // Enqueue all scene asset loads
        this.currentScene.loadScene();
        // Load all assets
        console.log("Starting Scene Load");
        this.resourceManager.loadResourcesFromQueue(() => {
            console.log("Starting Scene");
            this.currentScene.startScene();
            this.currentScene.setRunning(true);
        });
        this.renderingManager.setScene(this.currentScene);
    }
    /**
     * Generates a unique ID
     * @returns A new ID
     */
    generateId() {
        return this.idCounter++;
    }
    /**
     * Renders the current Scene
     */
    render() {
        if (this.currentScene) {
            this.currentScene.render();
        }
    }
    /**
     * Updates the current Scene
     * @param deltaT The timestep of the Scene
     */
    update(deltaT) {
        while (this.receiver.hasNextEvent()) {
            let ev = this.receiver.getNextEvent();
            if (ev.type === GameEventType_1.GameEventType.CHANGE_SCENE)
                this.changeToScene(ev.data.get("scene"), ev.data.get("init"));
        }
        if (this.pendingScene !== null) {
            this.doSceneChange();
        }
        if (this.currentScene && this.currentScene.isRunning()) {
            this.currentScene.update(deltaT);
        }
    }
}
exports.default = SceneManager;
},{"../Events/GameEventType":29,"../Events/Receiver":30,"../ResourceManager/ResourceManager":88}],100:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ignorePage
/**
 * The options to give a @reference[Scene] for initialization
 */
class SceneOptions {
    static parse(options) {
        let sOpt = new SceneOptions();
        if (options.physics === undefined) {
            sOpt.physics = { groups: undefined, collisions: undefined };
        }
        else {
            sOpt.physics = options.physics;
        }
        return sOpt;
    }
}
exports.default = SceneOptions;
},{}],101:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_AUDIO_CHANNELS = exports.AudioChannelType = void 0;
const Map_1 = __importDefault(require("../DataTypes/Collections/Map"));
const Receiver_1 = __importDefault(require("../Events/Receiver"));
const ResourceManager_1 = __importDefault(require("../ResourceManager/ResourceManager"));
const GameEventType_1 = require("../Events/GameEventType");
/**
 * Manages any sounds or music needed for the game.
 * Through the EventQueue, exposes interface to play sounds so GameNodes can activate sounds without
 * needing direct references to the audio system
 */
class AudioManager {
    constructor() {
        this.initAudio();
        this.receiver = new Receiver_1.default();
        this.receiver.subscribe([
            GameEventType_1.GameEventType.PLAY_SOUND,
            GameEventType_1.GameEventType.STOP_SOUND,
            GameEventType_1.GameEventType.PLAY_MUSIC,
            GameEventType_1.GameEventType.PLAY_SFX,
            GameEventType_1.GameEventType.MUTE_CHANNEL,
            GameEventType_1.GameEventType.UNMUTE_CHANNEL
        ]);
        this.currentSounds = new Map_1.default();
        this.gainNodes = new Array(exports.MAX_AUDIO_CHANNELS);
        this.initGainNodes();
    }
    /**
     * Get the instance of the AudioManager class or create a new one if none exists
     * @returns The AudioManager
     */
    static getInstance() {
        if (!this.instance) {
            this.instance = new AudioManager();
        }
        return this.instance;
    }
    /**
     * Initializes the webAudio context
     */
    initAudio() {
        try {
            window.AudioContext = window.AudioContext; // || window.webkitAudioContext; 
            this.audioCtx = new AudioContext();
            console.log('Web Audio API successfully loaded');
        }
        catch (e) {
            console.warn('Web Audio API is not supported in this browser');
        }
    }
    initGainNodes() {
        for (let i = 0; i < exports.MAX_AUDIO_CHANNELS; i++) {
            this.gainNodes[i] = this.audioCtx.createGain();
        }
    }
    /**
     * Returns the current audio context
     * @returns The AudioContext
     */
    getAudioContext() {
        return this.audioCtx;
    }
    /*
        According to the MDN, create a new sound for every call:

        An AudioBufferSourceNode can only be played once; after each call to start(), you have to create a new node
        if you want to play the same sound again. Fortunately, these nodes are very inexpensive to create, and the
        actual AudioBuffers can be reused for multiple plays of the sound. Indeed, you can use these nodes in a
        "fire and forget" manner: create the node, call start() to begin playing the sound, and don't even bother to
        hold a reference to it. It will automatically be garbage-collected at an appropriate time, which won't be
        until sometime after the sound has finished playing.
    */
    /**
     * Creates a new sound from the key of a loaded audio file
     * @param key The key of the loaded audio file to create a new sound for
     * @returns The newly created AudioBuffer
     */
    createSound(key, holdReference, channel, options) {
        // Get audio buffer
        let buffer = ResourceManager_1.default.getInstance().getAudio(key);
        // Create a sound source
        var source = this.audioCtx.createBufferSource();
        // Tell the source which sound to play
        source.buffer = buffer;
        // Add any additional nodes
        const nodes = [source];
        // Do any additional nodes here?
        // Of course, there aren't any supported yet...
        // Add the gain node for this channel
        nodes.push(this.gainNodes[channel]);
        // Connect any nodes along the path
        for (let i = 1; i < nodes.length; i++) {
            nodes[i - 1].connect(nodes[i]);
        }
        // Connect the source to the context's destination
        nodes[nodes.length - 1].connect(this.audioCtx.destination);
        return source;
    }
    /**
     * Play the sound specified by the key
     * @param key The key of the sound to play
     * @param loop A boolean for whether or not to loop the sound
     * @param holdReference A boolean for whether or not we want to hold on to a reference of the audio node. This is good for playing music on a loop that will eventually need to be stopped.
     */
    playSound(key, loop, holdReference, channel, options) {
        let sound = this.createSound(key, holdReference, channel, options);
        if (loop) {
            sound.loop = true;
        }
        // Add a reference of the new sound to a map. This will allow us to stop a looping or long sound at a later time
        if (holdReference) {
            this.currentSounds.add(key, sound);
        }
        sound.start();
    }
    /**
     * Stop the sound specified by the key
     */
    stopSound(key) {
        let sound = this.currentSounds.get(key);
        if (sound) {
            sound.stop();
            this.currentSounds.delete(key);
        }
    }
    muteChannel(channel) {
        this.gainNodes[channel].gain.setValueAtTime(0, this.audioCtx.currentTime);
    }
    unmuteChannel(channel) {
        this.gainNodes[channel].gain.setValueAtTime(1, this.audioCtx.currentTime);
    }
    /**
     * Sets the volume of a channel using the GainNode for that channel. For more
     * information on GainNodes, see https://developer.mozilla.org/en-US/docs/Web/API/GainNode
     * @param channel The audio channel to set the volume for
     * @param volume The volume of the channel. 0 is muted. Values below zero will be set to zero.
     */
    static setVolume(channel, volume) {
        if (volume < 0) {
            volume = 0;
        }
        const am = AudioManager.getInstance();
        am.gainNodes[channel].gain.setValueAtTime(volume, am.audioCtx.currentTime);
    }
    /**
     * Returns the GainNode for this channel.
     * Learn more about GainNodes here https://developer.mozilla.org/en-US/docs/Web/API/GainNode
     * DON'T USE THIS UNLESS YOU KNOW WHAT YOU'RE DOING
     * @param channel The channel
     * @returns The GainNode for the specified channel
     */
    getChannelGainNode(channel) {
        return this.gainNodes[channel];
    }
    update(deltaT) {
        // Play each audio clip requested
        // TODO - Add logic to merge sounds if there are multiple of the same key
        while (this.receiver.hasNextEvent()) {
            let event = this.receiver.getNextEvent();
            if (event.type === GameEventType_1.GameEventType.PLAY_SOUND || event.type === GameEventType_1.GameEventType.PLAY_MUSIC || event.type === GameEventType_1.GameEventType.PLAY_SFX) {
                let soundKey = event.data.get("key");
                let loop = event.data.get("loop");
                let holdReference = event.data.get("holdReference");
                let channel = AudioChannelType.DEFAULT;
                if (event.type === GameEventType_1.GameEventType.PLAY_MUSIC) {
                    channel = AudioChannelType.MUSIC;
                }
                else if (GameEventType_1.GameEventType.PLAY_SFX) {
                    channel = AudioChannelType.SFX;
                }
                else if (event.data.has("channel")) {
                    channel = event.data.get("channel");
                }
                this.playSound(soundKey, loop, holdReference, channel, event.data);
            }
            if (event.type === GameEventType_1.GameEventType.STOP_SOUND) {
                let soundKey = event.data.get("key");
                this.stopSound(soundKey);
            }
            if (event.type === GameEventType_1.GameEventType.MUTE_CHANNEL) {
                this.muteChannel(event.data.get("channel"));
            }
            if (event.type === GameEventType_1.GameEventType.UNMUTE_CHANNEL) {
                this.unmuteChannel(event.data.get("channel"));
            }
        }
    }
}
exports.default = AudioManager;
var AudioChannelType;
(function (AudioChannelType) {
    AudioChannelType[AudioChannelType["DEFAULT"] = 0] = "DEFAULT";
    AudioChannelType[AudioChannelType["SFX"] = 1] = "SFX";
    AudioChannelType[AudioChannelType["MUSIC"] = 2] = "MUSIC";
    AudioChannelType[AudioChannelType["CUSTOM_1"] = 3] = "CUSTOM_1";
    AudioChannelType[AudioChannelType["CUSTOM_2"] = 4] = "CUSTOM_2";
    AudioChannelType[AudioChannelType["CUSTOM_3"] = 5] = "CUSTOM_3";
    AudioChannelType[AudioChannelType["CUSTOM_4"] = 6] = "CUSTOM_4";
    AudioChannelType[AudioChannelType["CUSTOM_5"] = 7] = "CUSTOM_5";
    AudioChannelType[AudioChannelType["CUSTOM_6"] = 8] = "CUSTOM_6";
    AudioChannelType[AudioChannelType["CUSTOM_7"] = 9] = "CUSTOM_7";
    AudioChannelType[AudioChannelType["CUSTOM_8"] = 10] = "CUSTOM_8";
    AudioChannelType[AudioChannelType["CUSTOM_9"] = 11] = "CUSTOM_9";
})(AudioChannelType = exports.AudioChannelType || (exports.AudioChannelType = {}));
exports.MAX_AUDIO_CHANNELS = 12;
},{"../DataTypes/Collections/Map":5,"../Events/GameEventType":29,"../Events/Receiver":30,"../ResourceManager/ResourceManager":88}],102:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimerState = void 0;
const MathUtils_1 = __importDefault(require("../Utils/MathUtils"));
const TimerManager_1 = __importDefault(require("./TimerManager"));
/** */
class Timer {
    constructor(time, onEnd, loop = false) {
        // Register this timer
        TimerManager_1.default.getInstance().addTimer(this);
        this.totalTime = time;
        this.timeLeft = 0;
        this.onEnd = onEnd;
        this.loop = loop;
        this.state = TimerState.STOPPED;
        this.numRuns = 0;
    }
    isStopped() {
        return this.state === TimerState.STOPPED;
    }
    isPaused() {
        return this.state === TimerState.PAUSED;
    }
    /**
     * Returns whether or not this timer has been run before
     * @returns true if it has been run at least once (after the latest reset), and false otherwise
     */
    hasRun() {
        return this.numRuns > 0;
    }
    start(time) {
        if (time !== undefined) {
            this.totalTime = time;
        }
        this.state = TimerState.ACTIVE;
        this.timeLeft = this.totalTime;
    }
    /** Resets this timer. Sets the progress back to zero, and sets the number of runs back to zero */
    reset() {
        this.timeLeft = this.totalTime;
        this.numRuns = 0;
    }
    pause() {
        this.state = TimerState.PAUSED;
    }
    update(deltaT) {
        if (this.state === TimerState.ACTIVE) {
            this.timeLeft -= deltaT * 1000;
            if (this.timeLeft <= 0) {
                this.timeLeft = MathUtils_1.default.clampLow0(this.timeLeft);
                this.end();
            }
        }
    }
    getRemainingTime() {
        return this.timeLeft / 1000;
    }
    getTotalTime() {
        return this.totalTime / 1000;
    }
    end() {
        // Update the state
        this.state = TimerState.STOPPED;
        this.numRuns += 1;
        // Call the end function if there is one
        if (this.onEnd) {
            this.onEnd();
        }
        // Loop if we want to
        if (this.loop) {
            this.state = TimerState.ACTIVE;
            this.timeLeft = this.totalTime;
        }
    }
    toString() {
        return "Timer: " + this.state + " - Time Left: " + this.timeLeft + "ms of " + this.totalTime + "ms";
    }
}
exports.default = Timer;
var TimerState;
(function (TimerState) {
    TimerState["ACTIVE"] = "ACTIVE";
    TimerState["PAUSED"] = "PAUSED";
    TimerState["STOPPED"] = "STOPPED";
})(TimerState = exports.TimerState || (exports.TimerState = {}));
},{"../Utils/MathUtils":107,"./TimerManager":103}],103:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimerManager {
    constructor() {
        this.timers = new Array();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new TimerManager();
        }
        return this.instance;
    }
    addTimer(timer) {
        this.timers.push(timer);
    }
    clearTimers() {
        this.timers = new Array();
    }
    update(deltaT) {
        this.timers.forEach(timer => timer.update(deltaT));
    }
}
exports.default = TimerManager;
},{}],104:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("./MathUtils"));
// TODO: This should be moved to the datatypes folder
/**
 * A Color util class that keeps track of colors like a vector, but can be converted into a string format
 */
class Color {
    /**
     * Creates a new color
     * @param r Red
     * @param g Green
     * @param b Blue
     * @param a Alpha
     */
    constructor(r = 0, g = 0, b = 0, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    /**
     * Transparent color
     * @returns rgba(0, 0, 0, 0)
     */
    static get TRANSPARENT() {
        return new Color(0, 0, 0, 0);
    }
    /**
     * Red color
     * @returns rgb(255, 0, 0)
     */
    static get RED() {
        return new Color(255, 0, 0, 1);
    }
    /**
     * Green color
     * @returns rgb(0, 255, 0)
     */
    static get GREEN() {
        return new Color(0, 255, 0, 1);
    }
    /**
     * Blue color
     * @returns rgb(0, 0, 255)
     */
    static get BLUE() {
        return new Color(0, 0, 255, 1);
    }
    /**
     * Yellow color
     * @returns rgb(255, 255, 0)
     */
    static get YELLOW() {
        return new Color(255, 255, 0, 1);
    }
    /**
     * Magenta color
     * @returns rgb(255, 0, 255)
     */
    static get MAGENTA() {
        return new Color(255, 0, 255, 1);
    }
    /**
     * Cyan color
     * @returns rgb(0, 255, 255)
     */
    static get CYAN() {
        return new Color(0, 255, 255, 1);
    }
    /**
     * White color
     * @returns rgb(255, 255, 255)
     */
    static get WHITE() {
        return new Color(255, 255, 255, 1);
    }
    /**
     * Black color
     * @returns rgb(0, 0, 0)
     */
    static get BLACK() {
        return new Color(0, 0, 0, 1);
    }
    /**
     * Orange color
     * @returns rgb(255, 100, 0)
     */
    static get ORANGE() {
        return new Color(255, 100, 0, 1);
    }
    /**
     * Sets the color to the values provided
     * @param r Red
     * @param g Green
     * @param b Blue
     * @param a Alpha
     */
    set(r, g, b, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    /**
     * Returns a new color slightly lighter than the current color
     * @returns A new lighter Color
     */
    lighten() {
        return new Color(MathUtils_1.default.clamp(this.r + 40, 0, 255), MathUtils_1.default.clamp(this.g + 40, 0, 255), MathUtils_1.default.clamp(this.b + 40, 0, 255), MathUtils_1.default.clamp(this.a + 10, 0, 255));
    }
    /**
     * Returns a new color slightly darker than the current color
     * @returns A new darker Color
     */
    darken() {
        return new Color(MathUtils_1.default.clamp(this.r - 40, 0, 255), MathUtils_1.default.clamp(this.g - 40, 0, 255), MathUtils_1.default.clamp(this.b - 40, 0, 255), MathUtils_1.default.clamp(this.a + 10, 0, 255));
    }
    /**
     * Returns this color as an array
     * @returns [r, g, b, a]
     */
    toArray() {
        return [this.r, this.g, this.b, this.a];
    }
    /**
     * Returns the color as a string of the form #RRGGBB
     * @returns #RRGGBB
     */
    toString() {
        return "#" + MathUtils_1.default.toHex(this.r, 2) + MathUtils_1.default.toHex(this.g, 2) + MathUtils_1.default.toHex(this.b, 2);
    }
    /**
     * Returns the color as a string of the form rgb(r, g, b)
     * @returns rgb(r, g, b)
     */
    toStringRGB() {
        return "rgb(" + this.r.toString() + ", " + this.g.toString() + ", " + this.b.toString() + ")";
    }
    /**
     * Returns the color as a string of the form rgba(r, g, b, a)
     * @returns rgba(r, g, b, a)
     */
    toStringRGBA() {
        if (this.a === 0) {
            return this.toStringRGB();
        }
        return "rgba(" + this.r.toString() + ", " + this.g.toString() + ", " + this.b.toString() + ", " + this.a.toString() + ")";
    }
    /**
     * Turns this color into a float32Array and changes color range to [0.0, 1.0]
     * @returns a Float32Array containing the color
     */
    toWebGL() {
        return new Float32Array([
            this.r / 255,
            this.g / 255,
            this.b / 255,
            this.a
        ]);
    }
    static fromStringHex(str) {
        let i = 0;
        if (str.charAt(0) == "#")
            i += 1;
        let r = MathUtils_1.default.fromHex(str.substring(i, i + 2));
        let g = MathUtils_1.default.fromHex(str.substring(i + 2, i + 4));
        let b = MathUtils_1.default.fromHex(str.substring(i + 4, i + 6));
        return new Color(r, g, b);
    }
}
exports.default = Color;
},{"./MathUtils":107}],105:[function(require,module,exports){
"use strict";
// @ignorePage
Object.defineProperty(exports, "__esModule", { value: true });
exports.EaseFunctionType = void 0;
class EaseFunctions {
    static easeInOutSine(x) {
        return -(Math.cos(Math.PI * x) - 1) / 2;
    }
    static easeOutInSine(x) {
        return x < 0.5 ? -Math.cos(Math.PI * (x + 0.5)) / 2 : -Math.cos(Math.PI * (x - 0.5)) / 2 + 1;
    }
    static easeOutSine(x) {
        return Math.sin((x * Math.PI) / 2);
    }
    static easeInSine(x) {
        return 1 - Math.cos((x * Math.PI) / 2);
    }
    static easeInOutQuint(x) {
        return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
    }
    static easeInOutQuad(x) {
        return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
    }
    static easeOutInQuad(x) {
        return x < 0.5 ? this.easeOutIn_OutPow(x, 2) : this.easeOutIn_InPow(x, 2);
    }
    static easeOutIn_OutPow(x, pow) {
        return 0.5 - Math.pow(-2 * x + 1, pow) / 2;
    }
    static easeOutIn_InPow(x, pow) {
        return 0.5 + Math.pow(2 * x - 1, pow) / 2;
    }
}
exports.default = EaseFunctions;
var EaseFunctionType;
(function (EaseFunctionType) {
    // SINE
    EaseFunctionType["IN_OUT_SINE"] = "easeInOutSine";
    EaseFunctionType["OUT_IN_SINE"] = "easeOutInSine";
    EaseFunctionType["IN_SINE"] = "easeInSine";
    EaseFunctionType["OUT_SINE"] = "easeOutSine";
    // QUAD
    EaseFunctionType["IN_OUT_QUAD"] = "easeInOutQuad";
    EaseFunctionType["OUT_IN_QUAD"] = "easeOutInQuad";
    // QUINT
    EaseFunctionType["IN_OUT_QUINT"] = "easeInOutQuint";
})(EaseFunctionType = exports.EaseFunctionType || (exports.EaseFunctionType = {}));
},{}],106:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BinaryHeapSet_1 = __importDefault(require("../DataTypes/Collections/BinaryHeapSet"));
/** A class to provides some utility functions for graphs */
class GraphUtils {
    /**
     * An implementation of Djikstra's shortest path algorithm based on the one described in The Algorithm Design Manual.
     * @param g The graph
     * @param start The number to start the shortest path from
     * @returns An array containing the parent of each node of the Graph in the shortest path.
     */
    static djikstra(g, start) {
        let i; // Counter
        let p; // Pointer to edgenode
        let inTree = new Array(g.numVertices);
        let distance = new Array(g.numVertices);
        let parent = new Array(g.numVertices);
        let v; // Current vertex to process
        let w; // Candidate for next vertex
        let weight; // Edge weight
        let dist; // Best current distance from start
        for (i = 0; i < g.numVertices; i++) {
            inTree[i] = false;
            distance[i] = Infinity;
            parent[i] = -1;
        }
        distance[start] = 0;
        v = start;
        while (!inTree[v]) {
            inTree[v] = true;
            p = g.edges[v];
            while (p !== null) {
                w = p.y;
                weight = p.weight;
                if (distance[w] > distance[v] + weight) {
                    distance[w] = distance[v] + weight;
                    parent[w] = v;
                }
                p = p.next;
            }
            v = 0;
            dist = Infinity;
            for (i = 0; i <= g.numVertices; i++) {
                if (!inTree[i] && dist > distance[i]) {
                    dist = distance;
                    v = i;
                }
            }
        }
        return parent;
    }
    /**
     * An implementation of the A* algorithm
     * @param g the graph to search
     * @param start the node in the graph, g, to start searching from
     * @param goal the node in the graph, g, that A* should try to reach
     * @param heuristic the heuristic function used to calculate the f-score of a node in the graph, g
     * @return if a path between start and goal exists, an array of nodes representing the path from start
     * to goal found by A*; otherwise null
     */
    static astar(g, start, goal, heuristic) {
        // Construct a new map of the gScores - start gets a gScore of 0
        let gScore = new Map();
        gScore.set(start, 0);
        // Construct a new map of the fScores - f(n) = g(n) + h(n)
        let fScore = new Map();
        fScore.set(start, heuristic(start));
        // Construct a new map to hold the path from start to goal
        let cameFrom = new Map();
        // The open-set of nodes to be explored. Starts off with just starting node
        let openSet = new BinaryHeapSet_1.default((e1, e2) => {
            let e1fScore = fScore.has(e1) ? fScore.get(e1) : Number.POSITIVE_INFINITY;
            let e2fScore = fScore.has(e2) ? fScore.get(e2) : Number.POSITIVE_INFINITY;
            if (e1fScore < e2fScore)
                return 1;
            return 0;
        });
        openSet.push(start);
        // While there are elements in the openSet - explore the nodes
        while (!openSet.isEmpty()) {
            let current = openSet.peek();
            // If the next node is the goal - return the path
            if (current === goal) {
                let res = GraphUtils.astarPathBuilder(cameFrom, current);
                return res;
            }
            // Otherwise - remove the current node from the openSet and explore it's neighbors
            openSet.pop();
            // Iterate through the current node's edge list
            let edge = g.edges[current];
            while (edge !== null && edge !== undefined) {
                // Get the neighbor node from the edge
                let neighbor = edge.y;
                // Get tentative gscore
                let tentative_gscore = gScore.get(current) + edge.weight;
                // Get neighbors gscore - if neighbor doesn't have a gscore, default is positive infinity
                let neighbor_gscore = gScore.has(neighbor) ? gScore.get(neighbor) : Number.POSITIVE_INFINITY;
                if (tentative_gscore < neighbor_gscore) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentative_gscore);
                    fScore.set(neighbor, tentative_gscore + heuristic(neighbor));
                    // If the openSet already contains the neighbor, then restore the heap about the neighbor
                    if (openSet.has(neighbor)) {
                        openSet.restore(neighbor);
                        // Otherwise, the openSet doesn't contain the neighbor, so we add the neighbor to the openSet
                    }
                    else {
                        openSet.push(neighbor);
                    }
                }
                edge = edge.next;
            }
        }
        return null;
    }
    static astarPathBuilder(cameFrom, current) {
        let path = new Array();
        path.push(current);
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.push(current);
        }
        path.reverse();
        return path;
    }
}
exports.default = GraphUtils;
},{"../DataTypes/Collections/BinaryHeapSet":4}],107:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** A class containing some utility functions for math operations */
class MathUtils {
    /**
     * Returns the sign of the value provided
     * @param x The value to extract the sign from
     * @returns -1 if the number is less than 0, 1 otherwise
     */
    static sign(x) {
        return x < 0 ? -1 : 1;
    }
    /**
     * Returns whether or not x is between a and b
     * @param a The min bound
     * @param b The max bound
     * @param x The value to check
     * @param exclusive Whether or not a and b are exclusive bounds
     * @returns True if x is between a and b, false otherwise
     */
    static between(a, b, x, exclusive) {
        if (exclusive) {
            return (a < x) && (x < b);
        }
        else {
            return (a <= x) && (x <= b);
        }
    }
    /**
     * Clamps the value x to the range [min, max], rounding up or down if needed
     * @param x The value to be clamped
     * @param min The min of the range
     * @param max The max of the range
     * @returns x, if it is between min and max, or min/max if it exceeds their bounds
     */
    static clamp(x, min, max) {
        if (x < min)
            return min;
        if (x > max)
            return max;
        return x;
    }
    /**
     * Clamps the value x to the range between 0 and 1
     * @param x The value to be clamped
     * @returns x, if it is between 0 and 1, or 0/1 if it exceeds their bounds
     */
    static clamp01(x) {
        return MathUtils.clamp(x, 0, 1);
    }
    /**
     * Clamps the lower end of the value of x to the range to min
     * @param x The value to be clamped
     * @param min The minimum allowed value of x
     * @returns x, if it is greater than min, otherwise min
     */
    static clampLow(x, min) {
        return x < min ? min : x;
    }
    /**
     * Clamps the lower end of the value of x to zero
     * @param x The value to be clamped
     * @returns x, if it is greater than 0, otherwise 0
     */
    static clampLow0(x) {
        return MathUtils.clampLow(x, 0);
    }
    static clampMagnitude(v, m) {
        if (v.magSq() > m * m) {
            return v.scaleTo(m);
        }
        else {
            return v;
        }
    }
    static changeRange(x, min, max, newMin, newMax) {
        return this.lerp(newMin, newMax, this.invLerp(min, max, x));
    }
    /**
     * Linear Interpolation
     * @param a The first value for the interpolation bound
     * @param b The second value for the interpolation bound
     * @param t The time we are interpolating to
     * @returns The value between a and b at time t
     */
    static lerp(a, b, t) {
        return a + t * (b - a);
    }
    /**
     * Inverse Linear Interpolation. Finds the time at which a value between a and b would occur
     * @param a The first value for the interpolation bound
     * @param b The second value for the interpolation bound
     * @param value The current value
     * @returns The time at which the current value occurs between a and b
     */
    static invLerp(a, b, value) {
        return (value - a) / (b - a);
    }
    /**
     * Cuts off decimal points of a number after a specified place
     * @param num The number to floor
     * @param place The last decimal place of the new number
     * @returns The floored number
     */
    static floorToPlace(num, place) {
        if (place === 0) {
            return Math.floor(num);
        }
        let factor = 10;
        while (place > 1) {
            factor != 10;
            place--;
        }
        return Math.floor(num * factor) / factor;
    }
    /**
     * Returns a number from a hex string
     * @param str the string containing the hex number
     * @returns the number in decimal represented by the hex string
     */
    static fromHex(str) {
        return parseInt(str, 16);
    }
    /**
     * Returns the number as a hexadecimal
     * @param num The number to convert to hex
     * @param minLength The length of the returned hex string (adds zero padding if needed)
     * @returns The hex representation of the number as a string
     */
    static toHex(num, minLength = null) {
        let factor = 1;
        while (factor * 16 < num) {
            factor *= 16;
        }
        let hexStr = "";
        while (factor >= 1) {
            let digit = Math.floor(num / factor);
            hexStr += MathUtils.toHexDigit(digit);
            num -= digit * factor;
            factor /= 16;
        }
        if (minLength !== null) {
            while (hexStr.length < minLength) {
                hexStr = "0" + hexStr;
            }
        }
        return hexStr;
    }
    /**
     * Converts a digit to hexadecimal. In this case, a digit is between 0 and 15 inclusive
     * @param num The digit to convert to hexadecimal
     * @returns The hex representation of the digit as a string
     */
    static toHexDigit(num) {
        if (num < 10) {
            return "" + num;
        }
        else {
            return String.fromCharCode(65 + num - 10);
        }
    }
}
exports.default = MathUtils;
},{}],108:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("./MathUtils"));
const Color_1 = __importDefault(require("./Color"));
const Perlin_1 = __importDefault(require("./Rand/Perlin"));
const Vec2_1 = __importDefault(require("../DataTypes/Vec2"));
const seed_random_1 = __importDefault(require("seed-random"));
class Noise {
    constructor() {
        this.p = new Perlin_1.default();
    }
    perlin(x, y, z) {
        return this.p.perlin(x, y, z);
    }
}
/** A class that has some random generator utils */
class RandUtils {
    /**
     * The random function for Wolfie2D. The random() method generates a random number using
     * the function exported seed-random. This function does the exact same thing that
     * Math.random() does, except it allows us to use a seed.
     *
     * @returns a random number from the function _rand() that generates random numbers based
     * on the seed, _seed.
     */
    static random() {
        if (RandUtils._rand === undefined || RandUtils._rand === null) {
            RandUtils._rand = (0, seed_random_1.default)(RandUtils.seed);
        }
        return RandUtils._rand();
    }
    static randomSeed() {
        return Math.random().toString();
    }
    /**
     * Gets the seed used by the random number generator. If the seed is null or undefined,
     * a seed is generated using RandUtils.randomSeed().
     * @returns the seed
     */
    static get seed() {
        if (RandUtils._seed === undefined || RandUtils._seed === null) {
            RandUtils._seed = RandUtils.randomSeed();
        }
        return RandUtils._seed;
    }
    /**
     * Sets the seed used by the random number generator. Sets the _rand function used
     * by random() to a new function, seeded with the given seed.
     * @param seed the seed used by the random number generator
     */
    static set seed(seed) {
        RandUtils._seed = seed;
        RandUtils._rand = (0, seed_random_1.default)(seed);
    }
    /**
     * Generates a random integer in the specified range
     * @param min The min of the range (inclusive)
     * @param max The max of the range (exclusive)
     * @returns A random int in the range [min, max)
     */
    static randInt(min, max) {
        return Math.floor(RandUtils.random() * (max - min) + min);
    }
    /**
     * Generates a random float in the specified range
     * @param min The min of the range (inclusive)
     * @param max The max of the range (exclusive)
     * @returns A random float in the range [min, max)
     */
    static randFloat(min, max) {
        return RandUtils.random() * (max - min) + min;
    }
    /**
     * Generates a random hexadecimal number in the specified range
     * @param min The min of the range (inclusive)
     * @param max The max of the range (exclusive)
     * @returns a random hex number in the range [min, max) as a string
     */
    static randHex(min, max) {
        return MathUtils_1.default.toHex(RandUtils.randInt(min, max));
    }
    /**
     * Generates a random color
     * @returns A random Color
     */
    static randColor() {
        let r = RandUtils.randInt(0, 256);
        let g = RandUtils.randInt(0, 256);
        let b = RandUtils.randInt(0, 256);
        return new Color_1.default(r, g, b);
    }
    static randVec(minX, maxX, minY, maxY) {
        return new Vec2_1.default(this.randFloat(minX, maxX), this.randFloat(minY, maxY));
    }
}
exports.default = RandUtils;
/** A noise generator */
RandUtils.noise = new Noise();
},{"../DataTypes/Vec2":23,"./Color":104,"./MathUtils":107,"./Rand/Perlin":109,"seed-random":1}],109:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("../MathUtils"));
const permutation = [151, 160, 137, 91, 90, 15,
    131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
    190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
    77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
    102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
    135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
    5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
    223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
    129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
    251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
    49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
    138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
];
/**
 * A noise generator
 */
class Perlin {
    constructor() {
        this.p = new Int16Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = permutation[i % 256];
        }
        this.repeat = -1;
    }
    /**
     * Returns a random perlin noise value
     * @param x An input value
     * @param y An input value
     * @param z An input value
     * @returns A noise value
     */
    perlin(x, y, z = 0) {
        if (this.repeat > 0) {
            x = x % this.repeat;
            y = y % this.repeat;
            z = z % this.repeat;
        }
        // Get the position of the unit cube of (x, y, z)
        let xi = Math.floor(x) & 255;
        let yi = Math.floor(y) & 255;
        let zi = Math.floor(z) & 255;
        // Get the position of (x, y, z) in that unit cube
        let xf = x - Math.floor(x);
        let yf = y - Math.floor(y);
        let zf = z - Math.floor(z);
        // Use the fade function to relax the coordinates towards a whole value
        let u = this.fade(xf);
        let v = this.fade(yf);
        let w = this.fade(zf);
        // Perlin noise hash function
        let aaa = this.p[this.p[this.p[xi] + yi] + zi];
        let aba = this.p[this.p[this.p[xi] + this.inc(yi)] + zi];
        let aab = this.p[this.p[this.p[xi] + yi] + this.inc(zi)];
        let abb = this.p[this.p[this.p[xi] + this.inc(yi)] + this.inc(zi)];
        let baa = this.p[this.p[this.p[this.inc(xi)] + yi] + zi];
        let bba = this.p[this.p[this.p[this.inc(xi)] + this.inc(yi)] + zi];
        let bab = this.p[this.p[this.p[this.inc(xi)] + yi] + this.inc(zi)];
        let bbb = this.p[this.p[this.p[this.inc(xi)] + this.inc(yi)] + this.inc(zi)];
        // Calculate the value of the perlin noies
        let x1 = MathUtils_1.default.lerp(this.grad(aaa, xf, yf, zf), this.grad(baa, xf - 1, yf, zf), u);
        let x2 = MathUtils_1.default.lerp(this.grad(aba, xf, yf - 1, zf), this.grad(bba, xf - 1, yf - 1, zf), u);
        let y1 = MathUtils_1.default.lerp(x1, x2, v);
        x1 = MathUtils_1.default.lerp(this.grad(aab, xf, yf, zf - 1), this.grad(bab, xf - 1, yf, zf - 1), u);
        x2 = MathUtils_1.default.lerp(this.grad(abb, xf, yf - 1, zf - 1), this.grad(bbb, xf - 1, yf - 1, zf - 1), u);
        let y2 = MathUtils_1.default.lerp(x1, x2, v);
        return (MathUtils_1.default.lerp(y1, y2, w) + 1) / 2;
    }
    grad(hash, x, y, z) {
        switch (hash & 0xF) {
            case 0x0: return x + y;
            case 0x1: return -x + y;
            case 0x2: return x - y;
            case 0x3: return -x - y;
            case 0x4: return x + z;
            case 0x5: return -x + z;
            case 0x6: return x - z;
            case 0x7: return -x - z;
            case 0x8: return y + z;
            case 0x9: return -y + z;
            case 0xA: return y - z;
            case 0xB: return -y - z;
            case 0xC: return y + x;
            case 0xD: return -y + z;
            case 0xE: return y - x;
            case 0xF: return -y - z;
            default: return 0; // never happens
        }
    }
    /**
     * Safe increment that doesn't go beyond the repeat value
     * @param num The number to increment
     */
    inc(num) {
        num++;
        if (this.repeat > 0) {
            num %= this.repeat;
        }
        return num;
    }
    /**
     * The fade function 6t^5 - 15t^4 + 10t^3
     * @param t The value we are applying the fade to
     */
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
}
exports.default = Perlin;
},{"../MathUtils":107}],110:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MathUtils_1 = __importDefault(require("./MathUtils"));
class RenderingUtils {
    static toWebGLCoords(point, origin, worldSize) {
        return new Float32Array([
            MathUtils_1.default.changeRange(point.x, origin.x, origin.x + worldSize.x, -1, 1),
            MathUtils_1.default.changeRange(point.y, origin.y, origin.y + worldSize.y, 1, -1)
        ]);
    }
    static toWebGLScale(size, worldSize) {
        return new Float32Array([
            2 * size.x / worldSize.x,
            2 * size.y / worldSize.y,
        ]);
    }
    static toWebGLColor(color) {
        return new Float32Array([
            MathUtils_1.default.changeRange(color.r, 0, 255, 0, 1),
            MathUtils_1.default.changeRange(color.g, 0, 255, 0, 1),
            MathUtils_1.default.changeRange(color.b, 0, 255, 0, 1),
            color.a
        ]);
    }
}
exports.default = RenderingUtils;
},{"./MathUtils":107}],111:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Some utility functions for dealing with strings */
class StringUtils {
    /**
     * Extracts the path from a filepath that includes the file
     * @param filePath the filepath to extract the path from
     * @returns The path portion of the filepath provided
     */
    static getPathFromFilePath(filePath) {
        let splitPath = filePath.split("/");
        splitPath.pop();
        splitPath.push("");
        return splitPath.join("/");
    }
}
exports.default = StringUtils;
},{}],112:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const StateMachineAI_1 = __importDefault(require("../../../Wolfie2D/AI/StateMachineAI"));
const Input_1 = __importDefault(require("../../../Wolfie2D/Input/Input"));
const Events_1 = require("../../Events");
const PlayerController_1 = __importDefault(require("./PlayerController"));
const PlayerState_1 = require("./PlayerStates/PlayerState");
/**
 * The AI that controls the player. The players AI has been configured as a Finite State Machine (FSM)
 * with 4 states; Idle, Moving, Invincible, and Dead.
 */
class PlayerAI extends StateMachineAI_1.default {
    initializeAI(owner, opts) {
        this.owner = owner;
        this.controller = new PlayerController_1.default(owner);
        this.weapon = opts.weaponSystem;
        // Add the players states to it's StateMachine
        this.addState(PlayerState_1.PlayerStateType.IDLE, new PlayerState_1.Idle(this, this.owner));
        this.addState(PlayerState_1.PlayerStateType.INVINCIBLE, new PlayerState_1.Invincible(this, this.owner));
        this.addState(PlayerState_1.PlayerStateType.MOVING, new PlayerState_1.Moving(this, this.owner));
        this.addState(PlayerState_1.PlayerStateType.DEAD, new PlayerState_1.Dead(this, this.owner));
        // Initialize the players state to Idle
        this.initialize(PlayerState_1.PlayerStateType.IDLE);
    }
    activate(options) { }
    update(deltaT) {
        if (this.owner.getScene().isPaused)
            return;
        super.update(deltaT);
        if (Input_1.default.isMouseJustPressed()) {
            console.log("shoot");
            this.weapon.startSystem(500, 0, this.owner.position);
        }
    }
    destroy() { }
    handleEvent(event) {
        switch (event.type) {
            case Events_1.ItemEvent.LASERGUN_FIRED: {
                this.handleLaserFiredEvent(event.data.get("actorId"), event.data.get("to"), event.data.get("from"));
                break;
            }
            case Events_1.ItemEvent.ZOMBIE_HIT_PLAYER: {
                this.handleZombieHitEvent(event.data.get("actorId"));
                break;
            }
            default: {
                super.handleEvent(event);
                break;
            }
        }
    }
    handleZombieHitEvent(actorId) {
        console.log(actorId);
        if (this.owner.id !== actorId && this.owner.collisionShape !== undefined) {
            this.owner.health -= 1;
        }
    }
    handleLaserFiredEvent(actorId, to, from) {
        if (this.owner.id !== actorId && this.owner.collisionShape !== undefined) {
            if (this.owner.collisionShape
                .getBoundingRect()
                .intersectSegment(to, from.clone().sub(to)) !== null) {
                this.owner.health -= 1;
            }
        }
    }
}
exports.default = PlayerAI;
},{"../../../Wolfie2D/AI/StateMachineAI":3,"../../../Wolfie2D/Input/Input":31,"../../Events":124,"./PlayerController":113,"./PlayerStates/PlayerState":118}],113:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerInput = void 0;
const Vec2_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Vec2"));
const Input_1 = __importDefault(require("../../../Wolfie2D/Input/Input"));
/**
 * Strings used in the key binding for the player
 */
var PlayerInput;
(function (PlayerInput) {
    PlayerInput["MOVE_UP"] = "MOVE_UP";
    PlayerInput["MOVE_DOWN"] = "MOVE_DOWN";
    PlayerInput["MOVE_LEFT"] = "MOVE_LEFT";
    PlayerInput["MOVE_RIGHT"] = "MOVE_RIGHT";
    PlayerInput["ATTACKING"] = "ATTACKING";
    PlayerInput["PICKUP_ITEM"] = "PICKUP_ITEM";
    PlayerInput["DROP_ITEM"] = "DROP_ITEM";
})(PlayerInput = exports.PlayerInput || (exports.PlayerInput = {}));
/**
 * The PlayerController class handles processing the input recieved from the user and exposes
 * a set of methods to make dealing with the user input a bit simpler.
 */
class PlayerController {
    constructor(owner) {
        this.owner = owner;
    }
    /**
     * Gets the direction the player should move based on input from the keyboard.
     * @returns a Vec2 indicating the direction the player should move.
     */
    get moveDir() {
        let dir = Vec2_1.default.ZERO;
        dir.y =
            (Input_1.default.isPressed(PlayerInput.MOVE_UP) ? -1 : 0) +
                (Input_1.default.isPressed(PlayerInput.MOVE_DOWN) ? 1 : 0);
        dir.x =
            (Input_1.default.isPressed(PlayerInput.MOVE_LEFT) ? -1 : 0) +
                (Input_1.default.isPressed(PlayerInput.MOVE_RIGHT) ? 1 : 0);
        return dir.normalize();
    }
    /**
     * Gets the direction the player should be facing based on the position of the
     * mouse around the player
     * @return a Vec2 representing the direction the player should face.
     */
    get faceDir() {
        return this.owner.position.dirTo(Input_1.default.getGlobalMousePosition());
    }
    update(deltaT) {
        console.log("yay");
        /*super.update(deltaT);
    
        // If the player hits the attack button and the weapon system isn't running, restart the system and fire!
        if (Input.isPressed(HW3Controls.ATTACK) && !this.weapon.isSystemRunning()) {
          // Start the particle system at the player's current position
          this.weapon.startSystem(500, 0, this.owner.position);
          this.changeState(PlayerStates.ATTACKING);
        }*/
    }
    /**
     * Gets the rotation of the players sprite based on the direction the player
     * should be facing.
     * @return a number representing how much the player should be rotated
     */
    get rotation() {
        return Vec2_1.default.UP.angleToCCW(this.faceDir);
    }
    /**
     * Checks if the player is attempting to use a held item or not.
     * @return true if the player is attempting to use a held item; false otherwise
     */
    get useItem() {
        return Input_1.default.isMouseJustPressed();
    }
    /**
     * Checks if the player is attempting to pick up an item or not.
     * @return true if the player is attempting to pick up an item; false otherwise.
     */
    get pickingUp() {
        return Input_1.default.isJustPressed(PlayerInput.PICKUP_ITEM);
    }
    /**
     * Checks if the player is attempting to drop their held item or not.
     * @return true if the player is attempting to drop their held item; false otherwise.
     */
    get dropping() {
        return Input_1.default.isJustPressed(PlayerInput.DROP_ITEM);
    }
}
exports.default = PlayerController;
},{"../../../Wolfie2D/DataTypes/Vec2":23,"../../../Wolfie2D/Input/Input":31}],114:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Events_1 = require("../../../Events");
const PlayerState_1 = __importDefault(require("./PlayerState"));
/**
 * The Dead state for the PlayerAI. While the player is in the "Dead" state, the player does not
 * get updated and all incoming events to the PlayerAI are ignored.
 */
class Dead extends PlayerState_1.default {
    /**
     * When the PlayerAI enters the dead state, an event is fired to alert the system
     * that the player is officially dead.
     */
    onEnter(options) {
        this.emitter.fireEvent(Events_1.PlayerEvent.PLAYER_KILLED);
    }
    /**
     * The input handler for the dead state ignores all incoming events to the player.
     * @param event
     */
    handleInput(event) { }
    /**
     * Similar to the handleInput method, while in the dead state, the PlayerAI doesn't
     * get updated.
     * @param deltaT
     */
    update(deltaT) { }
    onExit() { return {}; }
}
exports.default = Dead;
},{"../../../Events":124,"./PlayerState":118}],115:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../../../Wolfie2D/DataTypes/Vec2"));
const PlayerState_1 = require("./PlayerState");
const PlayerState_2 = __importDefault(require("./PlayerState"));
class Idle extends PlayerState_2.default {
    onEnter(options) {
        this.parent.owner.animation.playIfNotAlready(PlayerState_1.PlayerAnimationType.IDLE, true);
    }
    handleInput(event) {
        switch (event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }
    update(deltaT) {
        super.update(deltaT);
        if (!this.parent.controller.moveDir.equals(Vec2_1.default.ZERO)) {
            this.finished(PlayerState_1.PlayerStateType.MOVING);
        }
    }
    onExit() {
        return {};
    }
}
exports.default = Idle;
},{"../../../../Wolfie2D/DataTypes/Vec2":23,"./PlayerState":118}],116:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Timer_1 = __importDefault(require("../../../../Wolfie2D/Timing/Timer"));
const PlayerState_1 = __importStar(require("./PlayerState"));
class Invincible extends PlayerState_1.default {
    constructor(parent, owner) {
        super(parent, owner);
        this.timer = new Timer_1.default(100, () => this.finished(PlayerState_1.PlayerStateType.IDLE));
    }
    update(deltaT) { }
    handleInput(event) {
        switch (event.type) {
            default: {
                super.handleInput(event);
                break;
            }
        }
    }
    onEnter(options) {
        this.timer.start();
    }
    onExit() {
        return {};
    }
}
exports.default = Invincible;
},{"../../../../Wolfie2D/Timing/Timer":102,"./PlayerState":118}],117:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../../../Wolfie2D/DataTypes/Vec2"));
const PlayerState_1 = require("./PlayerState");
const PlayerState_2 = __importDefault(require("./PlayerState"));
class Moving extends PlayerState_2.default {
    onEnter(options) {
    }
    handleInput(event) {
        switch (event.type) {
            default: {
                super.handleInput(event);
            }
        }
    }
    update(deltaT) {
        super.update(deltaT);
        if (this.parent.controller.moveDir.equals(Vec2_1.default.ZERO)) {
            this.finished(PlayerState_1.PlayerStateType.IDLE);
        }
    }
    onExit() { return {}; }
}
exports.default = Moving;
},{"../../../../Wolfie2D/DataTypes/Vec2":23,"./PlayerState":118}],118:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dead = exports.Moving = exports.Invincible = exports.Idle = exports.PlayerStateType = exports.PlayerAnimationType = void 0;
const State_1 = __importDefault(require("../../../../Wolfie2D/DataTypes/State/State"));
const Events_1 = require("../../../Events");
var PlayerAnimationType;
(function (PlayerAnimationType) {
    PlayerAnimationType["IDLE"] = "IDLE";
})(PlayerAnimationType = exports.PlayerAnimationType || (exports.PlayerAnimationType = {}));
var PlayerStateType;
(function (PlayerStateType) {
    PlayerStateType["IDLE"] = "IDLE";
    PlayerStateType["INVINCIBLE"] = "INVINCIBLE";
    PlayerStateType["ATTACKING"] = "ATTACKING";
    PlayerStateType["MOVING"] = "MOVING";
    PlayerStateType["DEAD"] = "DEAD";
})(PlayerStateType = exports.PlayerStateType || (exports.PlayerStateType = {}));
class PlayerState extends State_1.default {
    constructor(parent, owner) {
        super(parent);
        this.owner = owner;
    }
    onEnter(options) { }
    onExit() { return {}; }
    update(deltaT) {
        // Adjust the angle the player is facing 
        this.parent.owner.rotation = this.parent.controller.rotation;
        // Move the player
        this.parent.owner.move(this.parent.controller.moveDir);
        // Handle the player trying to pick up an item
        if (this.parent.controller.pickingUp) {
            // Request an item from the scene
            this.emitter.fireEvent(Events_1.ItemEvent.ITEM_REQUEST, { node: this.owner, inventory: this.owner.inventory });
        }
        // Handle the player trying to drop an item
        if (this.parent.controller.dropping) {
        }
        if (this.parent.controller.useItem) {
        }
    }
    handleInput(event) {
        switch (event.type) {
            default: {
                throw new Error(`Unhandled event of type ${event.type} caught in PlayerState!`);
            }
        }
    }
}
exports.default = PlayerState;
const Idle_1 = __importDefault(require("./Idle"));
exports.Idle = Idle_1.default;
const Invincible_1 = __importDefault(require("./Invincible"));
exports.Invincible = Invincible_1.default;
const Moving_1 = __importDefault(require("./Moving"));
exports.Moving = Moving_1.default;
const Dead_1 = __importDefault(require("./Dead"));
exports.Dead = Dead_1.default;
},{"../../../../Wolfie2D/DataTypes/State/State":20,"../../../Events":124,"./Dead":114,"./Idle":115,"./Invincible":116,"./Moving":117}],119:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Vec2"));
const Input_1 = __importDefault(require("../../../Wolfie2D/Input/Input"));
const ParticleSystem_1 = __importDefault(require("../../../Wolfie2D/Rendering/Animations/ParticleSystem"));
const EaseFunctions_1 = require("../../../Wolfie2D/Utils/EaseFunctions");
const RandUtils_1 = __importDefault(require("../../../Wolfie2D/Utils/RandUtils"));
/**
 * // TODO get the particles to move towards the mouse when the player attacks
 *
 * The particle system used for the player's attack. Particles in the particle system should
 * be spawned at the player's position and fired in the direction of the mouse's position.
 */
class PlayerWeapon extends ParticleSystem_1.default {
    getPool() {
        return this.particlePool;
    }
    /**
     * @returns true if the particle system is running; false otherwise.
     */
    isSystemRunning() {
        return this.systemRunning;
    }
    /**
     * Sets the animations for a particle in the player's weapon
     * @param particle the particle to give the animation to
     */
    setParticleAnimation(particle) {
        let mouse = Input_1.default.getGlobalMousePosition();
        let direction = mouse.sub(particle.position).normalize();
        let velocity = direction.scale(RandUtils_1.default.randInt(100, 200));
        velocity = velocity.add(new Vec2_1.default(RandUtils_1.default.randInt(-32, 32), RandUtils_1.default.randInt(-32, 32)));
        particle.vel = velocity;
        // Give the particle tweens
        particle.tweens.add("active", {
            startDelay: 0,
            duration: this.lifetime,
            effects: [
                {
                    property: "alpha",
                    start: 1,
                    end: 0,
                    ease: EaseFunctions_1.EaseFunctionType.IN_OUT_SINE,
                },
            ],
        });
    }
}
exports.default = PlayerWeapon;
},{"../../../Wolfie2D/DataTypes/Vec2":23,"../../../Wolfie2D/Input/Input":31,"../../../Wolfie2D/Rendering/Animations/ParticleSystem":71,"../../../Wolfie2D/Utils/EaseFunctions":105,"../../../Wolfie2D/Utils/RandUtils":108}],120:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AnimatedSprite_1 = __importDefault(require("../../Wolfie2D/Nodes/Sprites/AnimatedSprite"));
const Events_1 = require("../Events");
const BasicTargeting_1 = __importDefault(require("../GameSystems/Targeting/BasicTargeting"));
const BasicBattler_1 = __importDefault(require("../GameSystems/BattleSystem/BasicBattler"));
const Timer_1 = __importDefault(require("../../Wolfie2D/Timing/Timer"));
class NPCActor extends AnimatedSprite_1.default {
    constructor(sheet) {
        super(sheet);
        this._navkey = "navkey";
        this._battler = new BasicBattler_1.default(this);
        this._targeting = new BasicTargeting_1.default(this);
        this.invincibleTimer = new Timer_1.default(1000);
        this.receiver.subscribe("use-hpack");
    }
    /** The TargetingEntity interface */
    clearTarget() { this._targeting.clearTarget(); }
    setTarget(targetable) { this._targeting.setTarget(targetable); }
    hasTarget() { return this._targeting.hasTarget(); }
    getTarget() { return this._targeting.getTarget(); }
    /** The TargetableEntity interface */
    getTargeting() { return this._battler.getTargeting(); }
    addTargeting(targeting) { this._battler.addTargeting(targeting); }
    removeTargeting(targeting) { this._battler.removeTargeting(targeting); }
    atTarget() {
        return this._targeting.getTarget().position.distanceSqTo(this.position) < 625;
    }
    get battlerActive() { return this.battler.battlerActive; }
    set battlerActive(value) {
        this.battler.battlerActive = value;
        this.visible = value;
        this.aiActive = value;
    }
    get battleGroup() { return this.battler.battleGroup; }
    set battleGroup(battleGroup) { this.battler.battleGroup = battleGroup; }
    get maxHealth() { return this.battler.maxHealth; }
    set maxHealth(maxHealth) {
        this.battler.maxHealth = maxHealth;
        this.emitter.fireEvent(Events_1.HudEvent.HEALTH_CHANGE, { id: this.id, curhp: this.health, maxhp: this.maxHealth });
    }
    get health() { return this.battler.health; }
    set health(health) {
        this.battler.health = health;
        if (this.health <= 0 && this.battlerActive) {
            this.emitter.fireEvent(Events_1.BattlerEvent.BATTLER_KILLED, { id: this.id });
        }
    }
    get speed() { return this.battler.speed; }
    set speed(speed) { this.battler.speed = speed; }
    setScene(scene) { this.scene = scene; }
    getScene() { return this.scene; }
    get navkey() { return this._navkey; }
    set navkey(navkey) { this._navkey = navkey; }
    getPath(to, from) {
        return this.scene.getNavigationManager().getPath(this.navkey, to, from);
    }
    get inventory() { return this.battler.inventory; }
    /** Protected getters for the different components */
    get battler() { return this._battler; }
    get targeting() { return this._targeting; }
}
exports.default = NPCActor;
},{"../../Wolfie2D/Nodes/Sprites/AnimatedSprite":46,"../../Wolfie2D/Timing/Timer":102,"../Events":124,"../GameSystems/BattleSystem/BasicBattler":125,"../GameSystems/Targeting/BasicTargeting":133}],121:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AnimatedSprite_1 = __importDefault(require("../../Wolfie2D/Nodes/Sprites/AnimatedSprite"));
const Events_1 = require("../Events");
const BasicBattler_1 = __importDefault(require("../GameSystems/BattleSystem/BasicBattler"));
const BasicTargetable_1 = __importDefault(require("../GameSystems/Targeting/BasicTargetable"));
class PlayerActor extends AnimatedSprite_1.default {
    constructor(sheet) {
        super(sheet);
        this.battler = new BasicBattler_1.default(this);
        this.targetable = new BasicTargetable_1.default(this);
        this.receiver.subscribe(Events_1.ItemEvent.LASERGUN_FIRED);
        this.receiver.subscribe(Events_1.ItemEvent.ZOMBIE_HIT_PLAYER);
    }
    get battlerActive() {
        return this.battler.battlerActive;
    }
    set battlerActive(value) {
        this.battler.battlerActive = value;
        this.visible = value;
    }
    getTargeting() { return this.targetable.getTargeting(); }
    addTargeting(targeting) { this.targetable.addTargeting(targeting); }
    removeTargeting(targeting) { this.targetable.removeTargeting(targeting); }
    setScene(scene) { this.scene = scene; }
    getScene() { return this.scene; }
    get battleGroup() {
        return this.battler.battleGroup;
    }
    set battleGroup(value) {
        this.battler.battleGroup = value;
    }
    get maxHealth() {
        return this.battler.maxHealth;
    }
    set maxHealth(value) {
        this.battler.maxHealth = value;
    }
    get health() {
        return this.battler.health;
    }
    set health(value) {
        this.battler.health = value;
        if (this.health <= 0) {
            this.emitter.fireEvent(Events_1.BattlerEvent.BATTLER_KILLED, { id: this.id });
        }
    }
    get speed() {
        return this.battler.speed;
    }
    set speed(value) {
        this.battler.speed = value;
    }
    get inventory() {
        return this.battler.inventory;
    }
}
exports.default = PlayerActor;
},{"../../Wolfie2D/Nodes/Sprites/AnimatedSprite":46,"../Events":124,"../GameSystems/BattleSystem/BasicBattler":125,"../GameSystems/Targeting/BasicTargetable":132}],122:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Graphic_1 = __importDefault(require("../../Wolfie2D/Nodes/Graphic"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
class LightMask extends Graphic_1.default {
    constructor() {
        super();
        this.playerPosition = new Vec2_1.default(0, 0);
        this.playerRotation = 0;
    }
    updatePlayerInfo(position, rotation) {
        this.position = position;
        this.playerRotation = rotation;
    }
    setPlayerSize(size) {
        this.size = size;
    }
    setLightMaskScale(scale) {
        this.scale = scale;
    }
    addSpotlight(context, position, radius) {
        const radialGradient = context.createRadialGradient(position.x, position.y, 0, position.x, position.y, radius);
        radialGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        radialGradient.addColorStop(1, "rgba(255, 255, 255, 1)");
        context.fillStyle = radialGradient;
        console.log("Adding spotlight at position: " + position.toString());
        console.log("Adding spotlight with radius: " + radius);
        console.log("CONTEXT: " + context);
        return context;
    }
    addFlashlight(context, position, direction, radius, angle) {
        const endPoint = position.clone().add(direction.clone().scale(radius));
        const leftPoint = position.clone().add(direction.clone().rotateCCW(-angle / 2).scale(radius));
        const rightPoint = position.clone().add(direction.clone().rotateCCW(angle / 2).scale(radius));
        context.beginPath();
        context.moveTo(position.x, position.y);
        context.lineTo(leftPoint.x, leftPoint.y);
        context.lineTo(endPoint.x, endPoint.y);
        context.lineTo(rightPoint.x, rightPoint.y);
        context.closePath();
        context.fillStyle = "rgba(255, 255, 255, 1)";
        context.fill();
        return context;
    }
    render(renderer) {
        console.log("DSAHDKJHASKDH");
        // Clear the canvas
        renderer.clear(new Color_1.default(0, 0, 0, 1));
        // Save the current context state
        const ctx = renderer['ctx']; // Access the protected ctx property
        ctx.save();
        // Set the global composite operation to "screen" to make sure light sources are combined correctly
        ctx.globalCompositeOperation = "screen";
        // Use the addSpotlight method to render the spotlight at the player's position with a radius of 200
        this.addSpotlight(ctx, this.playerPosition, 200);
        console.log("DASJKHDJKASHJKDSAK");
        // Restore the context state
        ctx.restore();
    }
}
exports.default = LightMask;
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/Graphic":40,"../../Wolfie2D/Utils/Color":104}],123:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Mat4x4_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Mat4x4"));
const Vec2_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Vec2"));
const SpotLightShaderType_1 = __importDefault(require("../../../Wolfie2D/Rendering/WebGLRendering/ShaderTypes/SpotLightShaderType"));
class SpotlightShader extends SpotLightShaderType_1.default {
    initBufferObject() {
        this.bufferObjectKey = SpotlightShader.KEY;
        this.resourceManager.createBuffer(this.bufferObjectKey);
    }
    render(gl, options) {
        // Get our program and buffer object
        const program = this.resourceManager.getShaderProgram(this.programKey);
        const buffer = this.resourceManager.getBuffer(this.bufferObjectKey);
        // Let WebGL know we're using our shader program
        gl.useProgram(program);
        // Get our vertex data
        const vertexData = this.getVertices(options.size.x, options.size.y);
        const FSIZE = vertexData.BYTES_PER_ELEMENT;
        // Bind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);
        /* ##### ATTRIBUTES ##### */
        // No texture, the only thing we care about is vertex position
        const a_Position = gl.getAttribLocation(program, "a_Position");
        gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 2 * FSIZE, 0 * FSIZE);
        gl.enableVertexAttribArray(a_Position);
        /* ##### UNIFORMS ##### */
        // Get transformation matrix
        // We have a square for our rendering space, so get the maximum dimension of our quad
        let maxDimension = Math.max(options.size.x, options.size.y);
        // The size of the rendering space will be a square with this maximum dimension
        let size = new Vec2_1.default(maxDimension, maxDimension).scale(2 / options.worldSize.x, 2 / options.worldSize.y);
        // Center our translations around (0, 0)
        const translateX = (options.position.x - options.origin.x - options.worldSize.x / 2) / maxDimension;
        const translateY = -(options.position.y - options.origin.y - options.worldSize.y / 2) / maxDimension;
        // Create our transformation matrix
        this.translation.translate(new Float32Array([translateX, translateY]));
        this.scale.scale(size);
        this.rotation.rotate(options.rotation);
        let transformation = Mat4x4_1.default.MULT(this.translation, this.scale, this.rotation);
        // Pass the translation matrix to our shader
        const u_Transform = gl.getUniformLocation(program, "u_Transform");
        gl.uniformMatrix4fv(u_Transform, false, transformation.toArray());
        //color
        let webGL_color = options.color.toWebGL();
        const circle_Color = gl.getUniformLocation(program, "circle_Color");
        gl.uniform4f(circle_Color, webGL_color[0], webGL_color[1], webGL_color[2], webGL_color[3]);
        // Draw the quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        const u_LightPosition = gl.getUniformLocation(program, "u_LightPosition");
        gl.uniform2f(u_LightPosition, options.lightPosition.x, options.lightPosition.y);
        const u_LightColor = gl.getUniformLocation(program, "u_LightColor");
        let webGL_lightColor = options.lightColor.toWebGL();
        gl.uniform4f(u_LightColor, webGL_lightColor[0], webGL_lightColor[1], webGL_lightColor[2], webGL_lightColor[3]);
        const u_LightRadius = gl.getUniformLocation(program, "u_LightRadius");
        gl.uniform1f(u_LightRadius, options.lightRadius);
        const u_AmbientColor = gl.getUniformLocation(program, "u_AmbientColor");
        let webGL_ambientColor = options.ambientColor.toWebGL();
        gl.uniform4f(u_AmbientColor, webGL_ambientColor[0], webGL_ambientColor[1], webGL_ambientColor[2], webGL_ambientColor[3]);
    }
    getOptions(spotlight) {
        let options = {
            position: spotlight.position,
            size: spotlight.size,
            rotation: spotlight.rotation,
            lightPosition: spotlight.lightPosition,
            lightColor: spotlight.lightColor,
            lightRadius: spotlight.lightRadius,
            ambientColor: spotlight.ambientColor
        };
        return options;
    }
}
exports.default = SpotlightShader;
SpotlightShader.KEY = "SPOTLIGHT_SHADER_TYPE_KEY";
SpotlightShader.VSHADER = "builtin/shaders/spotlight.vshader";
SpotlightShader.FSHADER = "builtin/shaders/spotlight.fshader";
},{"../../../Wolfie2D/DataTypes/Mat4x4":13,"../../../Wolfie2D/DataTypes/Vec2":23,"../../../Wolfie2D/Rendering/WebGLRendering/ShaderTypes/SpotLightShaderType":86}],124:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SceneEvent = exports.InputEvent = exports.PlayerEvent = exports.HudEvent = exports.ItemEvent = exports.CheatEvent = exports.BattlerEvent = void 0;
var BattlerEvent;
(function (BattlerEvent) {
    BattlerEvent["BATTLER_KILLED"] = "BATTLER_KILLED";
    BattlerEvent["BATTLER_RESPAWN"] = "BATTLER_RESPAWN";
    BattlerEvent["BATTLER_CHANGE"] = "BATTLER_CHANGE";
    BattlerEvent["CONSUME"] = "CONSUME";
    BattlerEvent["HIT"] = "HIT";
})(BattlerEvent = exports.BattlerEvent || (exports.BattlerEvent = {}));
var CheatEvent;
(function (CheatEvent) {
    CheatEvent["UNLOCK_ALL_LEVELS"] = "UNLOCK_ALL_LEVELS";
    CheatEvent["INFINITE_HEALTH"] = "INFINITE_HEALTH";
    CheatEvent["END_DAY"] = "END_DAY";
})(CheatEvent = exports.CheatEvent || (exports.CheatEvent = {}));
var ItemEvent;
(function (ItemEvent) {
    ItemEvent["ITEM_REQUEST"] = "ITEM_REQUEST";
    ItemEvent["LASERGUN_FIRED"] = "LASERGUN_FIRED";
    ItemEvent["ZOMBIE_HIT_PLAYER"] = "ZOMBIE_HIT_PLAYER";
    ItemEvent["WEAPON_USED"] = "WEAPON_USED";
    ItemEvent["CONSUMABLE_USED"] = "CONSUMABLE_USED";
    ItemEvent["INVENTORY_CHANGED"] = "INVENTORY_CHANGED";
    ItemEvent["MATERIAL_PICKED_UP"] = "MATERIAL_PICKED_UP";
    ItemEvent["FUEL_PICKED_UP"] = "FUEL_PICKED_UP";
})(ItemEvent = exports.ItemEvent || (exports.ItemEvent = {}));
var HudEvent;
(function (HudEvent) {
    HudEvent["HEALTH_CHANGE"] = "HEALTH_CHANGE";
})(HudEvent = exports.HudEvent || (exports.HudEvent = {}));
var PlayerEvent;
(function (PlayerEvent) {
    PlayerEvent["PLAYER_KILLED"] = "PLAYER_KILLED";
})(PlayerEvent = exports.PlayerEvent || (exports.PlayerEvent = {}));
var InputEvent;
(function (InputEvent) {
    InputEvent["PAUSED"] = "PAUSED";
    InputEvent["SET_TIMEOUT"] = "SET_TIMEOUT";
    InputEvent["RESUMED"] = "RESUMED";
})(InputEvent = exports.InputEvent || (exports.InputEvent = {}));
var SceneEvent;
(function (SceneEvent) {
    SceneEvent["LEVEL_START"] = "LEVEL_START";
    SceneEvent["LEVEL_END"] = "LEVEL_END";
})(SceneEvent = exports.SceneEvent || (exports.SceneEvent = {}));
},{}],125:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Inventory_1 = __importDefault(require("../ItemSystem/Inventory"));
const BasicTargetable_1 = __importDefault(require("../Targeting/BasicTargetable"));
class BasicBattler {
    constructor(owner) {
        this._owner = owner;
        this._targetable = new BasicTargetable_1.default(owner);
        this.inventory = new Inventory_1.default();
        this.maxHealth = 0;
        this.health = 0;
        this.battleGroup = 0;
        this.speed = 0;
        this.battlerActive = true;
    }
    get id() { return this._owner.id; }
    get position() { return this._targetable.position; }
    set position(position) { this._targetable.position = position; }
    get relativePosition() {
        return this._targetable.relativePosition;
    }
    get battleGroup() { return this._battleGroup; }
    set battleGroup(battleGroup) { this._battleGroup = battleGroup; }
    get maxHealth() { return this._maxHealth; }
    set maxHealth(maxHealth) { this._maxHealth = maxHealth; }
    get health() { return this._health; }
    set health(health) { this._health = health; }
    get speed() { return this._speed; }
    set speed(speed) { this._speed = speed; }
    get inventory() { return this._inventory; }
    set inventory(inventory) { this._inventory = inventory; }
    get battlerActive() { return this._active; }
    set battlerActive(value) { this._active = value; }
    getTargeting() { return this._targetable.getTargeting(); }
    addTargeting(targeting) { this._targetable.addTargeting(targeting); }
    removeTargeting(targeting) { this._targetable.removeTargeting(targeting); }
}
exports.default = BasicBattler;
},{"../ItemSystem/Inventory":127,"../Targeting/BasicTargetable":132}],126:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Color_1 = __importDefault(require("../../../Wolfie2D/Utils/Color"));
const UIElementTypes_1 = require("../../../Wolfie2D/Nodes/UIElements/UIElementTypes");
/**
 * A UI component that's suppossed to represent a healthbar
 */
class HealthbarHUD {
    constructor(scene, owner, layer, options) {
        this.scene = scene;
        this.layer = layer;
        this.owner = owner;
        this.size = options.size;
        this.offset = options.offset;
        this.healthBar = this.scene.add.uiElement(UIElementTypes_1.UIElementType.LABEL, layer, { position: this.owner.position.clone().add(this.offset), text: "" });
        this.healthBar.size.copy(this.size);
        this.healthBar.backgroundColor = Color_1.default.RED;
        this.healthBarBg = this.scene.add.uiElement(UIElementTypes_1.UIElementType.LABEL, layer, { position: this.owner.position.clone().add(this.offset), text: "" });
        this.healthBarBg.backgroundColor = Color_1.default.TRANSPARENT;
        this.healthBarBg.borderColor = Color_1.default.BLACK;
        this.healthBarBg.borderWidth = 1;
        this.healthBarBg.size.copy(this.size);
    }
    /**
     * Updates the healthbars position according to the position of it's owner
     * @param deltaT
     */
    update(deltaT) {
        this.healthBar.position.copy(this.owner.position).add(this.offset);
        this.healthBarBg.position.copy(this.owner.position).add(this.offset);
        let scale = this.scene.getViewScale();
        this.healthBar.scale.scale(scale);
        this.healthBarBg.scale.scale(scale);
        let unit = this.healthBarBg.size.x / this.owner.maxHealth;
        this.healthBar.size.set(this.healthBarBg.size.x - unit * (this.owner.maxHealth - this.owner.health), this.healthBarBg.size.y);
        this.healthBar.position.set(this.healthBarBg.position.x - (unit / scale / 2) * (this.owner.maxHealth - this.owner.health), this.healthBarBg.position.y);
        this.healthBar.backgroundColor = this.owner.health < this.owner.maxHealth * 1 / 4 ? Color_1.default.RED : this.owner.health < this.owner.maxHealth * 3 / 4 ? Color_1.default.YELLOW : Color_1.default.GREEN;
    }
    get ownerId() { return this.owner.id; }
    set visible(visible) {
        this.healthBar.visible = visible;
        this.healthBarBg.visible = visible;
    }
}
exports.default = HealthbarHUD;
},{"../../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../../Wolfie2D/Utils/Color":104}],127:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Emitter_1 = __importDefault(require("../../../Wolfie2D/Events/Emitter"));
/**
 * An inventory is a collection of items. All items in the inventory must be registered with
 * the Inventorys ItemManager class.
 */
class Inventory {
    constructor(capacity = 9999) {
        this.__id = Inventory.NEXT_ID;
        Inventory.NEXT_ID += 1;
        this.inventory = new Map();
        this._emitter = new Emitter_1.default();
        this.size = 0;
        this.capacity = capacity;
        this.dirty = false;
        this.onChange = null;
    }
    get id() { return this.__id; }
    get dirty() { return this._dirty; }
    set dirty(dirty) { this._dirty = dirty; }
    get size() { return this._size; }
    set size(size) { this._size = size; }
    get capacity() { return this._capacity; }
    set capacity(capacity) { this._capacity = capacity; }
    get onChange() { return this._onChange; }
    set onChange(onChange) { this._onChange = onChange; }
    get inventory() { return this._inventory; }
    set inventory(inventory) { this._inventory = inventory; }
    get emitter() { return this._emitter; }
    set emitter(emitter) { this._emitter = emitter; }
    /**
     * Gets an item from this inventory by id.
     * @param id the id of the item to get
     * @returns the item if it exists; null otherwise
     */
    get(id) {
        if (!this.has(id)) {
            return null;
        }
        return this.inventory.get(id);
    }
    /**
     * Adds an item to this inventory
     * @param item adds an item to the inventory with the key of the items owner
     * @returns if the Item was successfully added to the inventory; null otherwise
     */
    add(item) {
        if (this.has(item.id) || this.size >= this.capacity || item.inventory !== null) {
            return null;
        }
        this.inventory.set(item.id, item);
        this.size += 1;
        this.dirty = true;
        item.inventory = this;
        item.visible = false;
        return item;
    }
    /**
     * Checks if an item with the given id number exists in this inventory.
     * @param id the id of the item in the inventory
     * @returns true if the item with the id exists; false otherwise
     */
    has(id) {
        return this.inventory.has(id);
    }
    /**
     * Removes the item with the given id number from this inventory
     * @param id the id of the item
     * @returns the item that was removed or null
     */
    remove(id) {
        if (!this.has(id)) {
            return null;
        }
        let item = this.get(id);
        this.inventory.delete(id);
        this.size -= 1;
        this.dirty = true;
        item.inventory = null;
        return item;
    }
    items() {
        return this.inventory.values();
    }
    find(func) {
        let item = Array.from(this.inventory.values()).find(func);
        return item === undefined ? null : item;
    }
    clean() {
        this.dirty = false;
        if (this.onChange !== null) {
            this.emitter.fireEvent(this.onChange, { id: this.id, inventory: this });
        }
    }
}
exports.default = Inventory;
/** The id number of the next inventory */
Inventory.NEXT_ID = 0;
},{"../../../Wolfie2D/Events/Emitter":26}],128:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Emitter_1 = __importDefault(require("../../../Wolfie2D/Events/Emitter"));
const BasicTargetable_1 = __importDefault(require("../Targeting/BasicTargetable"));
class Item {
    constructor(sprite) {
        this.sprite = sprite;
        this.emitter = new Emitter_1.default();
        this._inventory = null;
        this._targetable = new BasicTargetable_1.default(this.sprite);
    }
    getTargeting() {
        return this._targetable.getTargeting();
    }
    addTargeting(targeting) {
        this._targetable.addTargeting(targeting);
    }
    removeTargeting(targeting) {
        this._targetable.removeTargeting(targeting);
    }
    get relativePosition() { return this.sprite.relativePosition; }
    get id() { return this.sprite.id; }
    get position() { return this.sprite.position; }
    get visible() { return this.sprite.visible; }
    set visible(value) { this.sprite.visible = value; }
    get inventory() { return this._inventory; }
    set inventory(value) { this._inventory = value; }
}
exports.default = Item;
},{"../../../Wolfie2D/Events/Emitter":26,"../Targeting/BasicTargetable":132}],129:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Fuel.ts
const Item_1 = __importDefault(require("../Item"));
class Fuel extends Item_1.default {
    constructor(sprite) {
        super(sprite);
    }
}
exports.default = Fuel;
},{"../Item":128}],130:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Material.ts
const Item_1 = __importDefault(require("../Item"));
class Material extends Item_1.default {
    constructor(sprite) {
        super(sprite);
    }
}
exports.default = Material;
},{"../Item":128}],131:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowestHealthBattler = exports.ClosestPositioned = void 0;
function ClosestPositioned(positioned) {
    return (p1, p2) => {
        return p1.position.distanceSqTo(positioned.position) < p2.position.distanceSqTo(positioned.position) ? p1 : p2;
    };
}
exports.ClosestPositioned = ClosestPositioned;
function LowestHealthBattler(b1, b2) {
    return b1.health < b2.health ? b1 : b2;
}
exports.LowestHealthBattler = LowestHealthBattler;
},{}],132:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BasicTargetable {
    constructor(owner) {
        this.owner = owner;
        this.targeting = new Map();
    }
    getTargeting() {
        return Array.from(this.targeting.values());
    }
    addTargeting(targeting) {
        this.targeting.set(targeting.id, targeting);
    }
    removeTargeting(targeting) {
        this.targeting.delete(targeting.id);
    }
    get position() { return this.owner.position; }
    get relativePosition() { return this.owner.relativePosition; }
}
exports.default = BasicTargetable;
},{}],133:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BasicTargeting {
    constructor(owner) {
        this.owner = owner;
        this.target = null;
    }
    clearTarget() {
        if (this.target !== null) {
            this.target.removeTargeting(this);
        }
        this._target = null;
    }
    setTarget(targetable) {
        if (this.target !== null) {
            this.target.removeTargeting(this);
        }
        this.target = targetable;
        this.target.addTargeting(this);
    }
    getTarget() {
        if (this.target === null) {
            throw new Error("Target not set!");
        }
        return this.target;
    }
    hasTarget() {
        return this.target !== null;
    }
    get id() { return this.owner.id; }
    get target() { return this._target; }
    set target(target) { this._target = target; }
}
exports.default = BasicTargeting;
},{}],134:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Stack_1 = __importDefault(require("../../Wolfie2D/DataTypes/Collections/Stack"));
const NavigationPath_1 = __importDefault(require("../../Wolfie2D/Pathfinding/NavigationPath"));
const NavigationStrategy_1 = __importDefault(require("../../Wolfie2D/Pathfinding/Strategies/NavigationStrategy"));
const GraphUtils_1 = __importDefault(require("../../Wolfie2D/Utils/GraphUtils"));
/**
 * This is where the students will be implementing their version of A* - in theory.
 *
 * The AstarStrategy class is an extension of the abstract NavPathStrategy class. For our navigation system, you can
 * now specify and define your own pathfinding strategy. Originally, the two options were to use Djikstras or a
 * direct (point A -> point B) strategy. The only way to change how the pathfinding was done was by hard-coding things
 * into the classes associated with the navigation system.
 *
 * This is the Strategy design pattern ;)
 * @author PeteyLumpkins
 */
class AstarStrategy extends NavigationStrategy_1.default {
    /**
     * @see NavPathStrat.buildPath()
     */
    buildPath(to, from) {
        let start = this.mesh.graph.snap(from);
        let end = this.mesh.graph.snap(to);
        let pathStack = new Stack_1.default(this.mesh.graph.numVertices);
        // Push the final position and the final position in the graph
        pathStack.push(to.clone());
        pathStack.push(this.mesh.graph.positions[end]);
        // Use A* on the mesh's PositionGraph to find a path from start to end
        let parent = GraphUtils_1.default.astar(this.mesh.graph, start, end, (node) => {
            return this.mesh.graph.getNodePosition(node).distanceTo(this.mesh.graph.getNodePosition(end));
        });
        // If A* cannot find a path
        if (parent === null) {
            return new NavigationPath_1.default(pathStack);
        }
        // Need to push the nodes from the array returned from my implementation into the path stack
        for (let i = parent.length - 1; i >= 0; i--) {
            pathStack.push(this.mesh.graph.positions[parent[i]]);
        }
        return new NavigationPath_1.default(pathStack);
    }
}
exports.default = AstarStrategy;
},{"../../Wolfie2D/DataTypes/Collections/Stack":7,"../../Wolfie2D/Pathfinding/NavigationPath":59,"../../Wolfie2D/Pathfinding/Strategies/NavigationStrategy":62,"../../Wolfie2D/Utils/GraphUtils":106}],135:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
const UIElementTypes_1 = require("../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Scene_1 = __importDefault(require("../../Wolfie2D/Scene/Scene"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const MainMenu_1 = __importDefault(require("./MainMenu"));
class Controls extends Scene_1.default {
    constructor() {
        super(...arguments);
        this.highestLevelCompleted = 0;
    }
    loadScene() {
        this.load.image(Controls.MOUSE_KEY, Controls.MOUSE_PATH);
    }
    startScene() {
        this.addLayer("MOUSE", 0);
        const center = this.viewport.getCenter();
        this.Controls = this.addUILayer("Controls");
        // Return Button
        const backButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Controls", {
            position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 100, center.y - this.viewport.getHalfSize().y + 50),
            text: "X",
        });
        backButton.size.set(150, 50);
        backButton.borderWidth = 2;
        backButton.borderColor = Color_1.default.WHITE;
        backButton.backgroundColor = Color_1.default.BLACK;
        backButton.onClickEventId = "return";
        // Controls Label
        const controlsLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x, center.y - this.viewport.getHalfSize().y + 100),
            text: "CONTROLS",
        });
        controlsLabel.textColor = Color_1.default.WHITE;
        controlsLabel.backgroundColor = Color_1.default.RED;
        controlsLabel.fontSize = 48;
        // Movement Label
        const movementLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x - 300, center.y - 200),
            text: "MOVEMENT",
        });
        movementLabel.textColor = Color_1.default.RED;
        //   movementLabel.underline = true;
        // WASD buttons
        const wasdKeys = ["W", "A", "S", "D"];
        const wasdOffsets = [
            new Vec2_1.default(0, -75),
            new Vec2_1.default(-75, 0),
            new Vec2_1.default(0, 0),
            new Vec2_1.default(75, 0),
        ];
        for (let i = 0; i < wasdKeys.length; i++) {
            const keyButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Controls", {
                position: new Vec2_1.default(center.x - 300 + wasdOffsets[i].x, center.y - 50 + wasdOffsets[i].y),
                text: wasdKeys[i],
            });
            keyButton.size.set(50, 50);
            keyButton.borderWidth = 2;
            keyButton.borderColor = Color_1.default.WHITE;
            keyButton.backgroundColor = Color_1.default.BLACK;
            keyButton.disable();
        }
        // Direction labels
        const directions = ["Up", "Left", "Down", "Right"];
        const directionOffsets = [
            new Vec2_1.default(0, -50),
            new Vec2_1.default(-50, 0),
            new Vec2_1.default(0, 50),
            new Vec2_1.default(50, 0),
        ];
        for (let i = 0; i < directions.length; i++) {
            const directionLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
                position: new Vec2_1.default(center.x - 300 + wasdOffsets[i].x + directionOffsets[i].x, center.y - 50 + wasdOffsets[i].y + directionOffsets[i].y),
                text: directions[i],
            });
            directionLabel.textColor = Color_1.default.WHITE;
            directionLabel.fontSize = 16;
        }
        // Attacking Label
        const attackingLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x + 300, center.y - 200),
            text: "ATTACKING",
        });
        attackingLabel.textColor = Color_1.default.RED;
        // attackingLabel.underline = true;
        // Mouse image
        // Load the mouse image asset in loadScene()
        this.initMouse();
        // Attack Label
        const attackLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x + 200, center.y - 150),
            text: "ATTACK",
        });
        attackLabel.fontSize = 16;
        attackLabel.textColor = Color_1.default.WHITE;
        // Other Label
        const otherLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x, center.y + 100),
            text: "OTHER",
        });
        otherLabel.textColor = Color_1.default.RED;
        // otherLabel.underline = true;
        // Spacebar Button
        const spacebarButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Controls", {
            position: new Vec2_1.default(center.x - 300, center.y + 200),
            text: "Space",
        });
        spacebarButton.size.set(200, 50);
        spacebarButton.borderWidth = 2;
        spacebarButton.borderColor = Color_1.default.WHITE;
        spacebarButton.backgroundColor = Color_1.default.BLACK;
        spacebarButton.disable();
        // Pickup Item Label
        const pickupItemLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x - 300, center.y + 270),
            text: "Pick-up item",
        });
        pickupItemLabel.textColor = Color_1.default.WHITE;
        pickupItemLabel.fontSize = 16;
        // Pause Button
        const pauseButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Controls", {
            position: new Vec2_1.default(center.x + 300, center.y + 200),
            text: "ESC",
        });
        pauseButton.size.set(100, 50);
        pauseButton.borderWidth = 2;
        pauseButton.borderColor = Color_1.default.WHITE;
        pauseButton.backgroundColor = Color_1.default.BLACK;
        pauseButton.disable();
        // Pause Game Label
        const pauseGameLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Controls", {
            position: new Vec2_1.default(center.x + 300, center.y + 270),
            text: "Pause game",
        });
        pauseGameLabel.textColor = Color_1.default.WHITE;
        pauseGameLabel.fontSize = 16;
        // Subscribe to the button events
        this.receiver.subscribe("return");
    }
    updateScene() {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case "return":
                this.sceneManager.changeToScene(MainMenu_1.default);
                break;
        }
    }
    initMouse() {
        this.mouse = this.add.sprite(Controls.MOUSE_KEY, "MOUSE");
        const center = this.viewport.getCenter();
        this.mouse.scale.set(1, 1);
        this.mouse.position.set(center.x + 300, center.y - 100);
    }
}
exports.default = Controls;
Controls.BACKGROUND_KEY = "BACKGROUND";
Controls.BACKGROUND_PATH = "assets/sprites/background.jpg";
Controls.MOUSE_KEY = "MOUSE";
Controls.MOUSE_PATH = "assets/sprites/Mouse.png";
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../Wolfie2D/Scene/Scene":98,"../../Wolfie2D/Utils/Color":104,"./MainMenu":142}],136:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
const UIElementTypes_1 = require("../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Scene_1 = __importDefault(require("../../Wolfie2D/Scene/Scene"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const MainMenu_1 = __importDefault(require("./MainMenu"));
class Help extends Scene_1.default {
    loadScene() { }
    startScene() {
        const center = this.viewport.getCenter();
        this.Help = this.addUILayer("Help");
        // Return Button
        const backButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Help", {
            position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 100, center.y - this.viewport.getHalfSize().y + 50),
            text: "X",
        });
        backButton.size.set(150, 50);
        backButton.borderWidth = 2;
        backButton.borderColor = Color_1.default.WHITE;
        backButton.backgroundColor = Color_1.default.BLACK;
        backButton.onClickEventId = "return";
        const controlsLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
            position: new Vec2_1.default(center.x, center.y - this.viewport.getHalfSize().y + 100),
            text: "HELP",
        });
        controlsLabel.textColor = Color_1.default.WHITE;
        controlsLabel.backgroundColor = Color_1.default.RED;
        controlsLabel.fontSize = 48;
        const text = [
            "In Undead Siege, you are humanity's last          ",
            "hope, entrusted with the ultimate mission:        ",
            "delivering the cure to a deadly virus that has    ",
            "turned the world into a zombie-infested           ",
            "wasteland. Navigate through the harsh             ",
            "environments, refuel your helicopter, and         ",
            "upgrade your arsenal, all while fending off       ",
            "relentless waves of the undead. Each level        ",
            "brings you closer to the final research facility, ",
            "where you must gather fuel and attachment         ",
            "upgrades for your weapon during the day,          ",
            "and defend your helicopter and yourself from      ",
            "hordes of zombies at night. With the fate of      ",
            "humanity on the line, it's up to you to           ",
            "complete your mission, save the remaining         ",
            "survivors, and change the course of history.      ",
            "Are you ready to face the challenge and           ",
            "become the hero the world desperately needs?      ",
            "        The Undead Siege awaits.                  ",
        ];
        for (let i = 0; i < text.length; i++) {
            const controlsLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
                position: new Vec2_1.default(center.x + 25, center.y - this.viewport.getHalfSize().y + 150 + i * 20),
                text: text[i],
            });
            controlsLabel.textColor = Color_1.default.WHITE;
            controlsLabel.fontSize = 16;
        }
        const developersLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
            position: new Vec2_1.default(center.x, center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 50),
            text: "DEVELOPERS",
        });
        developersLabel.textColor = Color_1.default.WHITE;
        const developers = ["Kevin Liu", "Joey Chan", "Luigi Razon"];
        for (let i = 0; i < developers.length; i++) {
            const devLabels = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
                position: new Vec2_1.default(center.x, center.y -
                    this.viewport.getHalfSize().y +
                    150 +
                    text.length * 20 +
                    100 +
                    i * 40),
                text: developers[i],
            });
            devLabels.textColor = Color_1.default.RED;
            devLabels.fontSize = 30;
        }
        const cheatLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
            position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 150, center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 50),
            text: "CHEATS",
        });
        cheatLabel.textColor = Color_1.default.RED;
        const cheats = ["[0] - Unlock all levels", "[9] - Infinite Health", "[8] - End day/night"];
        for (let i = 0; i < cheats.length; i++) {
            const cheatButtons = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Help", {
                position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 150, center.y - this.viewport.getHalfSize().y + 150 + text.length * 20 + 100 + i * 40),
                text: cheats[i],
            });
            // cheatButtons.size.set(150, 30);
            // cheatButtons.borderWidth = 2;
            // cheatButtons.borderColor = Color.BLACK
            cheatButtons.textColor = Color_1.default.WHITE;
            // cheatButtons.backgroundColor = Color.WHITE;
            cheatButtons.fontSize = 15;
        }
        // Subscribe to the button events
        this.receiver.subscribe("return");
        // this.receiver.subscribe("UNLOCK ALL LEVELS");
    }
    updateScene() {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case "return":
                this.sceneManager.changeToScene(MainMenu_1.default);
                break;
            case "UNLOCK ALL LEVELS":
                this.emitter.fireEvent("allLevelCheatUnlock");
                break;
        }
    }
}
exports.default = Help;
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../Wolfie2D/Scene/Scene":98,"../../Wolfie2D/Utils/Color":104,"./MainMenu":142}],137:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
const UIElementTypes_1 = require("../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Scene_1 = __importDefault(require("../../Wolfie2D/Scene/Scene"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const MainMenu_1 = __importDefault(require("./MainMenu"));
const Events_1 = require("../Events");
const Level1_1 = __importDefault(require("./Levels/Level1"));
const Level2_1 = __importDefault(require("./Levels/Level2"));
class LevelSelectionScene extends Scene_1.default {
    constructor() {
        super(...arguments);
        this.highestLevelCompleted = 0;
        this.levelButtons = [];
    }
    loadScene() {
        this.load.image(LevelSelectionScene.BACKGROUND_KEY, LevelSelectionScene.BACKGROUND_PATH);
    }
    startScene() {
        const center = this.viewport.getCenter();
        this.highestLevelCompleted = parseInt(localStorage.getItem("highestLevelCompleted") || "0");
        this.addLayer("BACKGROUND", 0);
        this.initBackground();
        this.LevelSelectionScene = this.addUILayer("LevelSelectionScene");
        // Return Button
        const backButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "LevelSelectionScene", {
            position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 100, center.y - this.viewport.getHalfSize().y + 50),
            text: "Back",
        });
        backButton.size.set(150, 50);
        backButton.borderWidth = 2;
        backButton.borderColor = Color_1.default.WHITE;
        backButton.backgroundColor = Color_1.default.BLACK;
        backButton.onClickEventId = "return";
        // Create an array to store the level buttons
        this.levelButtons = [];
        // Loop through the levels and create buttons
        for (let i = 1; i <= 6; i++) {
            const levelButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "LevelSelectionScene", {
                position: new Vec2_1.default(center.x - 350 + ((i - 1) % 3) * 350, center.y - 150 + Math.floor((i - 1) / 3) * 200),
                text: `Level ${i}`,
            });
            levelButton.size.set(300, 50);
            levelButton.borderWidth = 2;
            levelButton.backgroundColor = Color_1.default.BLUE;
            levelButton.borderColor = Color_1.default.WHITE;
            levelButton.onClickEventId = `level${i}`;
            // Check if the level is unlocked
            if (i <= this.highestLevelCompleted + 1) {
                levelButton.backgroundColor = Color_1.default.BLACK;
                levelButton.enable();
            }
            else {
                levelButton.backgroundColor = Color_1.default.WHITE;
                levelButton.disable();
            }
            this.levelButtons.push(levelButton);
        }
        this.unlockLevels(this.levelButtons);
        /**
         * IMPLEMENTED AFTER A LEVEL IS COMPLETED. TAKE THIS AWAY FROM HERE!!!!!
         */
        //const highestLevelCompleted = parseInt(localStorage.getItem("highestLevelCompleted") || "0");
        // if (levelNumber > highestLevelCompleted) {
        //   localStorage.setItem("highestLevelCompleted", levelNumber.toString());
        // }
        // Subscribe to the button events
        this.receiver.subscribe("return");
        this.receiver.subscribe("level1");
        this.receiver.subscribe("level2");
        this.receiver.subscribe("level3");
        this.receiver.subscribe("level4");
        this.receiver.subscribe("level5");
        this.receiver.subscribe("level6");
        this.receiver.subscribe("allLevelCheatUnlock");
        this.receiver.subscribe(Events_1.CheatEvent.UNLOCK_ALL_LEVELS);
    }
    updateScene() {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case Events_1.CheatEvent.UNLOCK_ALL_LEVELS: {
                this.highestLevelCompleted = 5;
                localStorage.setItem("highestLevelCompleted", this.highestLevelCompleted.toString());
                this.unlockLevels(this.levelButtons);
                break;
            }
            case "return":
                this.sceneManager.changeToScene(MainMenu_1.default);
                break;
            case "level1":
                this.sceneManager.changeToScene(Level1_1.default);
                break;
            case "level2":
                this.sceneManager.changeToScene(Level2_1.default);
                break;
            case "level3":
                break;
            case "level4":
                break;
            case "level5":
                break;
            case "level6":
                break;
        }
    }
    initBackground() {
        this.background = this.add.sprite(LevelSelectionScene.BACKGROUND_KEY, "BACKGROUND");
        const center = this.viewport.getCenter();
        const imageSize = this.background.size;
        // Calculate the scale factors for the X and Y dimensions
        const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
        const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
        // // Set the scale of the background image to match the viewport dimensions
        this.background.scale.set(scaleX, scaleY);
        this.background.position.copy(center);
    }
    unlockLevels(levelButtons) {
        for (let i = 0; i < levelButtons.length; i++) {
            if (i <= this.highestLevelCompleted) {
                levelButtons[i].backgroundColor = Color_1.default.BLACK;
                levelButtons[i].enable(); // Enable the button
            }
            else {
                levelButtons[i].backgroundColor = Color_1.default.BLUE;
                levelButtons[i].disable(); // Disable the button
            }
        }
    }
}
exports.default = LevelSelectionScene;
LevelSelectionScene.BACKGROUND_KEY = "BACKGROUND";
LevelSelectionScene.BACKGROUND_PATH = "assets/sprites/background.jpg";
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../Wolfie2D/Scene/Scene":98,"../../Wolfie2D/Utils/Color":104,"../Events":124,"./Levels/Level1":139,"./Levels/Level2":140,"./MainMenu":142}],138:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Scene_1 = __importDefault(require("../../../Wolfie2D/Scene/Scene"));
class HW4Scene extends Scene_1.default {
}
exports.default = HW4Scene;
},{"../../../Wolfie2D/Scene/Scene":98}],139:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Level2_1 = __importDefault(require("./Level2"));
const MainHW4Scene_1 = __importDefault(require("./MainHW4Scene"));
const SpotLightShader_1 = __importDefault(require("../../Custom/Shaders/SpotLightShader"));
// import HW4Scene from "./HW4Scene";
/**
 * The first level for HW4 - should be the one with the grass and the clouds.
 */
class Level1 extends MainHW4Scene_1.default {
    // public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    // public static readonly LEVEL_MUSIC_PATH = "hw4_assets/music/hw5_level_music.wav";
    // public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    // public static readonly JUMP_AUDIO_PATH = "hw4_assets/sounds/jump.wav";
    // public static readonly DEATH_AUDIO_KEY = "PLAYER_DEATH";
    // public static readonly DEATH_AUDIO_PATH = "hw4_assets/sounds/death.wav";
    // public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    // public static readonly TILE_DESTROYED_PATH = "hw4_assets/sounds/switch.wav";
    // public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));
    constructor(viewport, sceneManager, renderingManager, options) {
        super(viewport, sceneManager, renderingManager, options);
        // Set the keys for the different layers of the tilemap
        this.levelKey = Level1.TILEMAP_KEY;
        // this.tilemapScale = Level1.TILEMAP_SCALE;
        // this.destructibleLayerKey = Level1.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = Level1.WALLS_LAYER_KEY;
        // Set the key for the player's sprite
        // this.playerSpriteKey = Level1.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        // this.playerSpawn = Level1.PLAYER_SPAWN;
        // Music and sound
        // this.levelMusicKey = Level1.LEVEL_MUSIC_KEY
        // this.jumpAudioKey = Level1.JUMP_AUDIO_KEY;
        // this.deathAudioKey = Level1.DEATH_AUDIO_KEY;
        // this.tileDestroyedAudioKey = Level1.TILE_DESTROYED_KEY;
        // Level end size and position
        // this.levelEndPosition = new Vec2(128, 232).mult(this.tilemapScale);
        // this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);
    }
    /**
     * Load in our resources for level 1
     */
    loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", Level1.PLAYER_SPRITE_PATH);
        // Load in the enemy sprites
        this.load.spritesheet("BlueEnemy", Level1.ZOMBIE_PATH);
        // Load the tilemap
        this.load.tilemap(this.levelKey, Level1.TILEMAP_PATH);
        // this.load.tilemap("level", "assets/tilemaps/HW3Tilemap.json");
        // Load the enemy locations
        this.load.object("blue", Level1.ZOMBIE_SPAWNS_PATH);
        // Load the healthpack and lasergun loactions
        this.load.object("healthpacks", Level1.HEALTHPACK_SPAWNS_PATH);
        this.load.object("laserguns", Level1.LASERGUN_SPAWNS_PATH);
        // Load the material and fuel locations
        this.load.object("materials", Level1.MATERIAL_SPAWNS_PATH);
        this.load.object("fuels", Level1.FUEL_SPAWNS_PATH);
        // Load the healthpack, inventory slot, and laser gun sprites
        // this.load.image("healthpack", "assets/sprites/healthpack.png");
        // this.load.image("inventorySlot", "assets/sprites/inventory.png");
        // this.load.image("laserGun", "assets/sprites/laserGun.png");
        this.load.image(MainHW4Scene_1.default.MATERIAL_KEY, MainHW4Scene_1.default.MATERIAL_PATH);
        this.load.image(MainHW4Scene_1.default.FUEL_KEY, MainHW4Scene_1.default.FUEL_PATH);
        this.load.image(MainHW4Scene_1.default.LOGO_KEY, MainHW4Scene_1.default.LOGO_PATH);
        this.load.image(MainHW4Scene_1.default.PAUSE_BG_KEY, MainHW4Scene_1.default.PAUSE_BG_PATH);
        this.load.image(MainHW4Scene_1.default.NIGHT_KEY, MainHW4Scene_1.default.NIGHT_PATH);
        this.load.shader(SpotLightShader_1.default.KEY, SpotLightShader_1.default.VSHADER, SpotLightShader_1.default.FSHADER);
    }
    /**
     * Unload resources for level 1
     */
    unloadScene() {
        // this.resourceManager.keepSpritesheet(this.playerSpriteKey);
        // this.resourceManager.keepAudio(this.jumpAudioKey);
        // this.resourceManager.keepAudio(this.deathAudioKey);
        // this.resourceManager.keepAudio(this.tileDestroyedAudioKey);
        // this.resourceManager.unloadAllResources();
        // TODO decide which resources to keep/cull
        // this.unload.tilemap(this.tilemapKey);
        // this.keepSpriteSheet(this.playerSpriteKey, Level1.PLAYER_SPRITE_PATH);
    }
    startScene() {
        super.startScene();
        // Set the next level to be Level2
        this.nextLevel = Level2_1.default;
    }
    /**
     * I had to override this method to adjust the viewport for the first level. I screwed up
     * when I was making the tilemap for the first level is what it boils down to.
     *
     * - Peter
     */
    initializeViewport() {
        // super.initializeViewport();
        // this.viewport.setBounds(16, 16, 496, 512);
    }
}
exports.default = Level1;
// public static readonly PLAYER_SPAWN = new Vec2(32, 32);
//Player
Level1.PLAYER_SPRITE_KEY = "PLAYER_SPRITE_KEY";
Level1.PLAYER_SPRITE_PATH = "assets/spritesheets/player1.json";
//Tile maps
Level1.TILEMAP_KEY = "LEVEL1";
Level1.TILEMAP_PATH = "assets/tilemaps/Level1Map.json";
// public static readonly TILEMAP_SCALE = new Vec2(2, 2);
Level1.WALLS_LAYER_KEY = "Main";
//Load the enemy sprites
Level1.ZOMBIE_KEY = "ZOMBIE";
Level1.ZOMBIE_PATH = "assets/spritesheets/BlueEnemy.json";
// Load the enemy locations
Level1.ZOMBIE_SPAWNS = "ZOMBIE_SPAWNS";
Level1.ZOMBIE_SPAWNS_PATH = "assets/data/enemies/blue.json";
Level1.HEALTHPACK_SPAWNS = "HEALTHPACK_SPAWNS";
Level1.HEALTHPACK_SPAWNS_PATH = "assets/data/items/healthpacks.json";
Level1.LASERGUN_SPAWNS = "LASERGUN_SPAWNS";
Level1.LASERGUN_SPAWNS_PATH = "assets/data/items/laserguns.json";
// Load the material and fuel locations
Level1.MATERIAL_SPAWNS = "MATERIAL_SPAWNS";
Level1.MATERIAL_SPAWNS_PATH = "assets/data/items/materials.json";
Level1.FUEL_SPAWNS = "FUEL_SPAWNS";
Level1.FUEL_SPAWNS_PATH = "assets/data/items/fuels.json";
},{"../../Custom/Shaders/SpotLightShader":123,"./Level2":140,"./MainHW4Scene":141}],140:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const MainHW4Scene_1 = __importDefault(require("./MainHW4Scene"));
const MainMenu_1 = __importDefault(require("../MainMenu"));
const SpotLightShader_1 = __importDefault(require("../../Custom/Shaders/SpotLightShader"));
/**
 * The first level for HW4 - should be the one with the grass and the clouds.
 */
class Level2 extends MainHW4Scene_1.default {
    // public static readonly LEVEL_MUSIC_KEY = "LEVEL_MUSIC";
    // public static readonly LEVEL_MUSIC_PATH = "hw4_assets/music/hw5_level_music.wav";
    // public static readonly JUMP_AUDIO_KEY = "PLAYER_JUMP";
    // public static readonly JUMP_AUDIO_PATH = "hw4_assets/sounds/jump.wav";
    // public static readonly DEATH_AUDIO_KEY = "PLAYER_DEATH";
    // public static readonly DEATH_AUDIO_PATH = "hw4_assets/sounds/death.wav";
    // public static readonly TILE_DESTROYED_KEY = "TILE_DESTROYED";
    // public static readonly TILE_DESTROYED_PATH = "hw4_assets/sounds/switch.wav";
    // public static readonly LEVEL_END = new AABB(new Vec2(224, 232), new Vec2(24, 16));
    constructor(viewport, sceneManager, renderingManager, options) {
        super(viewport, sceneManager, renderingManager, options);
        // Set the keys for the different layers of the tilemap
        this.levelKey = Level2.TILEMAP_KEY;
        // this.tilemapScale = Level2.TILEMAP_SCALE;
        // this.destructibleLayerKey = Level2.DESTRUCTIBLE_LAYER_KEY;
        this.wallsLayerKey = Level2.WALLS_LAYER_KEY;
        // Set the key for the player's sprite
        // this.playerSpriteKey = Level2.PLAYER_SPRITE_KEY;
        // Set the player's spawn
        // this.playerSpawn = Level2.PLAYER_SPAWN;
        // Music and sound
        // this.levelMusicKey = Level2.LEVEL_MUSIC_KEY
        // this.jumpAudioKey = Level2.JUMP_AUDIO_KEY;
        // this.deathAudioKey = Level2.DEATH_AUDIO_KEY;
        // this.tileDestroyedAudioKey = Level2.TILE_DESTROYED_KEY;
        // Level end size and position
        // this.levelEndPosition = new Vec2(128, 232).mult(this.tilemapScale);
        // this.levelEndHalfSize = new Vec2(32, 32).mult(this.tilemapScale);
    }
    /**
     * Load in our resources for level 1
     */
    loadScene() {
        // Load the player and enemy spritesheets
        this.load.spritesheet("player1", Level2.PLAYER_SPRITE_PATH);
        // Load in the enemy sprites
        this.load.spritesheet("BlueEnemy", Level2.ZOMBIE_PATH);
        // Load the tilemap
        this.load.tilemap(this.levelKey, Level2.TILEMAP_PATH);
        // this.load.tilemap("level", "assets/tilemaps/HW3Tilemap.json");
        // Load the enemy locations
        this.load.object("blue", Level2.ZOMBIE_SPAWNS_PATH);
        // Load the healthpack and lasergun loactions
        this.load.object("healthpacks", Level2.HEALTHPACK_SPAWNS_PATH);
        this.load.object("laserguns", Level2.LASERGUN_SPAWNS_PATH);
        // Load the material and fuel locations
        this.load.object("materials", Level2.MATERIAL_SPAWNS_PATH);
        this.load.object("fuels", Level2.FUEL_SPAWNS_PATH);
        // Load the healthpack, inventory slot, and laser gun sprites
        // this.load.image("healthpack", "assets/sprites/healthpack.png");
        // this.load.image("inventorySlot", "assets/sprites/inventory.png");
        // this.load.image("laserGun", "assets/sprites/laserGun.png");
        this.load.image(MainHW4Scene_1.default.MATERIAL_KEY, MainHW4Scene_1.default.MATERIAL_PATH);
        this.load.image(MainHW4Scene_1.default.FUEL_KEY, MainHW4Scene_1.default.FUEL_PATH);
        this.load.image(MainHW4Scene_1.default.LOGO_KEY, MainHW4Scene_1.default.LOGO_PATH);
        this.load.image(MainHW4Scene_1.default.PAUSE_BG_KEY, MainHW4Scene_1.default.PAUSE_BG_PATH);
        this.load.image(MainHW4Scene_1.default.NIGHT_KEY, MainHW4Scene_1.default.NIGHT_PATH);
        this.load.shader(SpotLightShader_1.default.KEY, SpotLightShader_1.default.VSHADER, SpotLightShader_1.default.FSHADER);
    }
    /**
     * Unload resources for level 1
     */
    unloadScene() {
        // this.resourceManager.keepSpritesheet(this.playerSpriteKey);
        // this.resourceManager.keepAudio(this.jumpAudioKey);
        // this.resourceManager.keepAudio(this.deathAudioKey);
        // this.resourceManager.keepAudio(this.tileDestroyedAudioKey);
        // this.resourceManager.unloadAllResources();
        // TODO decide which resources to keep/cull
        // this.unload.tilemap(this.tilemapKey);
        // this.keepSpriteSheet(this.playerSpriteKey, Level2.PLAYER_SPRITE_PATH);
    }
    startScene() {
        super.startScene();
        // Set the next level to be Level2
        this.nextLevel = MainMenu_1.default;
    }
    /**
     * I had to override this method to adjust the viewport for the first level. I screwed up
     * when I was making the tilemap for the first level is what it boils down to.
     *
     * - Peter
     */
    initializeViewport() {
        // super.initializeViewport();
        // this.viewport.setBounds(16, 16, 496, 512);
    }
}
exports.default = Level2;
Level2.PLAYER_SPRITE_PATH = "assets/spritesheets/player1.json";
Level2.TILEMAP_KEY = "LEVEL2";
Level2.TILEMAP_PATH = "assets/tilemaps/Level2Map.json";
// public static readonly TILEMAP_SCALE = new Vec2(2, 2);
Level2.WALLS_LAYER_KEY = "Main";
Level2.ZOMBIE_KEY = "ZOMBIE";
Level2.ZOMBIE_PATH = "assets/spritesheets/BlueEnemy.json";
// Load the enemy locations
Level2.ZOMBIE_SPAWNS = "ZOMBIE_SPAWNS";
Level2.ZOMBIE_SPAWNS_PATH = "assets/data/enemies/blue.json";
Level2.HEALTHPACK_SPAWNS = "HEALTHPACK_SPAWNS";
Level2.HEALTHPACK_SPAWNS_PATH = "assets/data/items/healthpacks.json";
Level2.LASERGUN_SPAWNS = "LASERGUN_SPAWNS";
Level2.LASERGUN_SPAWNS_PATH = "assets/data/items/laserguns.json";
// Load the material and fuel locations
Level2.MATERIAL_SPAWNS = "MATERIAL_SPAWNS";
Level2.MATERIAL_SPAWNS_PATH = "assets/data/items/materials.json";
Level2.FUEL_SPAWNS = "FUEL_SPAWNS";
Level2.FUEL_SPAWNS_PATH = "assets/data/items/fuels.json";
},{"../../Custom/Shaders/SpotLightShader":123,"../MainMenu":142,"./MainHW4Scene":141}],141:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PositionGraph_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Graphs/PositionGraph"));
const AABB_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Shapes/AABB"));
const Vec2_1 = __importDefault(require("../../../Wolfie2D/DataTypes/Vec2"));
const Navmesh_1 = __importDefault(require("../../../Wolfie2D/Pathfinding/Navmesh"));
const DirectStrategy_1 = __importDefault(require("../../../Wolfie2D/Pathfinding/Strategies/DirectStrategy"));
const Timer_1 = __importDefault(require("../../../Wolfie2D/Timing/Timer"));
const Color_1 = __importDefault(require("../../../Wolfie2D/Utils/Color"));
const MathUtils_1 = __importDefault(require("../../../Wolfie2D/Utils/MathUtils"));
const NPCActor_1 = __importDefault(require("../../Actors/NPCActor"));
const PlayerActor_1 = __importDefault(require("../../Actors/PlayerActor"));
const PlayerAI_1 = __importDefault(require("../../AI/Player/PlayerAI"));
const Events_1 = require("../../Events");
const HealthbarHUD_1 = __importDefault(require("../../GameSystems/HUD/HealthbarHUD"));
const HW4Reducers_1 = require("../../GameSystems/Searching/HW4Reducers");
const AstarStrategy_1 = __importDefault(require("../../Pathfinding/AstarStrategy"));
const HW4Scene_1 = __importDefault(require("./HW4Scene"));
const UIElementTypes_1 = require("../../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Material_1 = __importDefault(require("../../GameSystems/ItemSystem/Items/Material"));
const Fuel_1 = __importDefault(require("../../GameSystems/ItemSystem/Items/Fuel"));
const MainMenu_1 = __importDefault(require("../MainMenu"));
const SpotLightShader_1 = __importDefault(require("../../Custom/Shaders/SpotLightShader"));
const PlayerWeapon_1 = __importDefault(require("../../AI/Player/PlayerWeapon"));
const Input_1 = __importDefault(require("../../../Wolfie2D/Input/Input"));
const BattlerGroups = {
    RED: 1,
    BLUE: 2,
};
class MainHW4Scene extends HW4Scene_1.default {
    constructor(viewport, sceneManager, renderingManager, options) {
        super(viewport, sceneManager, renderingManager, options);
        this.battlers = new Array();
        this.healthbars = new Map();
        this.laserguns = new Array();
        this.healthpacks = new Array();
        this.materials = new Array();
        this.fuels = new Array();
    }
    /**
     * @see Scene.startScene
     */
    startScene() {
        this.initialViewportSize = new Vec2_1.default(this.viewport.getHalfSize().x * 2, this.viewport.getHalfSize().y * 2);
        // Add in the tilemap
        let tilemapLayers = this.add.tilemap(this.levelKey, this.tilemapScale);
        // Get the wall layer
        this.walls = tilemapLayers[1].getItems()[0];
        // Set the viewport bounds to the tilemap
        let tilemapSize = this.walls.size;
        this.viewport.setBounds(0, 0, tilemapSize.x, tilemapSize.y);
        this.viewport.setZoomLevel(2);
        this.initLayers();
        this.initializeUI();
        this.initPauseUI();
        this.elapsedTime = 0;
        this.countDownTimer = new Timer_1.default(120 * 1000);
        this.countDownTimer.start();
        this.initializeWeaponSystem();
        // Create the player
        this.initializePlayer();
        this.initializeNPCs();
        this.initializeItems();
        this.initializeNavmesh();
        this.night = this.add.sprite(MainHW4Scene.NIGHT_KEY, "night");
        this.night.alpha = 0;
        this.night.scale.set(2, 2);
        this.night.position.set(this.viewport.getHalfSize().x, this.viewport.getHalfSize().y);
        //LIGHT MASK
        this.initializeSpotLight();
        //Initialize the day/night cycle
        this.isNight = false;
        // Subscribe to relevant events
        this.receiver.subscribe("healthpack");
        this.receiver.subscribe("enemyDied");
        this.receiver.subscribe(Events_1.ItemEvent.ITEM_REQUEST);
        this.receiver.subscribe(Events_1.ItemEvent.MATERIAL_PICKED_UP);
        this.receiver.subscribe(Events_1.ItemEvent.FUEL_PICKED_UP);
        this.receiver.subscribe(Events_1.InputEvent.PAUSED);
        this.receiver.subscribe("exit");
        this.receiver.subscribe("unPause");
        this.receiver.subscribe("showCheats");
        this.receiver.subscribe("showControls");
        this.receiver.subscribe(Events_1.CheatEvent.INFINITE_HEALTH);
        this.receiver.subscribe(Events_1.CheatEvent.END_DAY);
        this.receiver.subscribe(Events_1.SceneEvent.LEVEL_END);
        this.receiver.subscribe(Events_1.SceneEvent.LEVEL_START);
        // Add a UI for health
        this.addUILayer("health");
        this.receiver.subscribe(Events_1.PlayerEvent.PLAYER_KILLED);
        this.receiver.subscribe(Events_1.BattlerEvent.BATTLER_KILLED);
        this.receiver.subscribe(Events_1.BattlerEvent.BATTLER_RESPAWN);
    }
    /**
     * @see Scene.updateScene
     */
    updateScene(deltaT) {
        // Move input handling outside the if statement
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
        if (!this.isPaused) {
            // this.inventoryHud.update(deltaT);
            this.healthbars.forEach((healthbar) => healthbar.update(deltaT));
            this.elapsedTime += deltaT;
            // Update the timer
            this.countDownTimer.update(deltaT);
            // Update the timer label
            const remainingTime = Math.max(this.countDownTimer.getTotalTime() - this.elapsedTime, 0);
            const minutes = Math.floor(remainingTime / 60);
            const seconds = Math.floor(remainingTime % 60);
            this.timerLabel.text = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            if (this.isNight) {
                const player = this.battlers[0];
                this.lightMask.position = player.position.clone();
                this.lightMask.updatePlayerInfo(this.battlers[0].position, 100);
                if (remainingTime <= 0) {
                    console.log("end of night");
                    console.log(this.emitter.fireEvent(Events_1.SceneEvent.LEVEL_END, { scene: this }));
                }
            }
            if (remainingTime <= 0) {
                console.log("PLAYER: ", this.battlers[0]);
                console.log("Time's up!");
                this.isNight = !this.isNight;
                if (this.isNight !== this.wasNight) {
                    this.wasNight = this.isNight;
                    if (this.isNight) {
                        console.log("It's night time!");
                        this.night.alpha = .7;
                        this.lightMask.alpha = 0.7;
                        console.log(this.getLayer("primary"));
                        console.log("LIGHT MASK: ", this.lightMask);
                    }
                    else {
                        console.log("It's day time!");
                        this.night.alpha = 0;
                        this.lightMask.alpha = 0;
                    }
                    this.countDownTimer.reset();
                    this.countDownTimer.start();
                    this.elapsedTime = 0;
                }
            }
        }
    }
    initializeSpotLight() {
        this.testLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "lightMask", { position: this.viewport.getCenter(), text: "TESTLJKDHSAJKDHKHASKDHJKASHJKDHJAS" });
        this.testLabel.textColor = Color_1.default.WHITE;
        this.testLabel.fontSize = 20;
        this.lightMask = this.add.lightMask("lightMask");
        this.getLayer("lightMask").addNode(this.lightMask);
        this.lightMask.color = Color_1.default.fromStringHex("#000000");
        this.lightMask.alpha = 1; // Set initial alpha to 0, it will be updated based on day/night cycle
        this.lightMask.size = new Vec2_1.default(100, 100);
        this.lightMask.useCustomShader(SpotLightShader_1.default.KEY);
        // console.log("LIGHT MASK: ", this.lightMask);
        // console.log("PRIMARY LAYER: ", this.primaryLayer);
    }
    /** Initializes the layers in the scene */
    initLayers() {
        this.addLayer("primary", 10);
        this.addUILayer("lightMask");
        this.addUILayer("slots");
        this.addUILayer("items");
        this.addUILayer("timer");
        this.addUILayer("Counters");
        this.addUILayer("Pause");
        this.addUILayer("night");
        this.getLayer("lightMask").setDepth(11);
        this.getLayer("night").setDepth(1);
        this.getLayer("Pause").setDepth(2);
        this.getLayer("timer").setDepth(2);
        this.getLayer("Counters").setDepth(2);
        this.getLayer("slots").setDepth(2);
        this.getLayer("items").setDepth(1);
    }
    initializeWeaponSystem() {
        this.playerWeaponSystem = new PlayerWeapon_1.default(50, Vec2_1.default.ZERO, 1000, 3, 0, 50);
        this.playerWeaponSystem.initializePool(this, "primary");
    }
    /**
     * Handle events from the rest of the game
     * @param event a game event
     */
    handleEvent(event) {
        if (this.isPaused) {
            switch (event.type) {
                case "exit": {
                    this.resetViewportSize();
                    this.sceneManager.changeToScene(MainMenu_1.default);
                    break;
                }
                case "unPause": {
                    this.handlePaused();
                    break;
                }
                case "showCheats": {
                    this.handleShowCheats();
                    break;
                }
                case "showControls": {
                    console.log("SHOW CONTROLS");
                    this.handleShowControls();
                    break;
                }
                case Events_1.InputEvent.PAUSED: {
                    this.handlePaused();
                    break;
                }
            }
        }
        else if (!this.isPaused || event.type === Events_1.InputEvent.PAUSED) {
            switch (event.type) {
                case Events_1.SceneEvent.LEVEL_START: {
                    Input_1.default.enableInput();
                    break;
                }
                case Events_1.SceneEvent.LEVEL_END: {
                    console.log("LEVEL END");
                    this.resetViewportSize();
                    this.sceneManager.changeToScene(this.nextLevel);
                    break;
                }
                case "allLevelCheatUnlock": {
                    this.handleAllLevelCheatUnlock();
                    break;
                }
                case Events_1.InputEvent.PAUSED: {
                    this.handlePaused();
                    break;
                }
                case Events_1.BattlerEvent.BATTLER_KILLED: {
                    this.handleBattlerKilled(event);
                    break;
                }
                case Events_1.BattlerEvent.BATTLER_RESPAWN: {
                    break;
                }
                case Events_1.ItemEvent.ITEM_REQUEST: {
                    this.handleItemRequest(event.data.get("node"), event.data.get("inventory"));
                    break;
                }
                case Events_1.ItemEvent.MATERIAL_PICKED_UP: {
                    this.handleMaterialPickedUp();
                    break;
                }
                case Events_1.ItemEvent.FUEL_PICKED_UP: {
                    this.handleFuelPickedUp();
                    break;
                }
                case Events_1.CheatEvent.INFINITE_HEALTH: {
                    this.handleInfiniteHealth();
                    break;
                }
                case Events_1.CheatEvent.END_DAY: {
                    this.handleEndDayCheat();
                    break;
                }
                default: {
                    throw new Error(`Unhandled event type "${event.type}" caught in HW3Scene event handler`);
                }
            }
        }
    }
    handleItemRequest(node, inventory) {
        let items = new Array(...this.materials, ...this.fuels).filter((item) => {
            return (item.inventory === null &&
                item.position.distanceTo(node.position) <= 100);
        });
        if (items.length > 0) {
            const pickedUpItem = items.reduce((0, HW4Reducers_1.ClosestPositioned)(node));
            inventory.add(pickedUpItem);
            if (pickedUpItem instanceof Material_1.default) {
                this.emitter.fireEvent(Events_1.ItemEvent.MATERIAL_PICKED_UP);
            }
            else if (pickedUpItem instanceof Fuel_1.default) {
                this.emitter.fireEvent(Events_1.ItemEvent.FUEL_PICKED_UP);
            }
        }
    }
    //PICKING UP MATERIALS
    handleMaterialPickedUp() {
        const currentValue = parseInt(this.materialCounter.text);
        this.materialCounter.text = (currentValue + 1).toString();
    }
    handleFuelPickedUp() {
        const currentValue = parseInt(this.fuelCounter.text);
        this.fuelCounter.text = (currentValue + 1).toString();
    }
    //PAUSE SCREEN
    handlePaused() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.showPauseUI();
        }
        else {
            this.hidePauseUI();
        }
    }
    handleShowCheats() {
        this.showCheatsUI();
    }
    handleAllLevelCheatUnlock() {
        this.emitter.fireEvent("allLevelCheatUnlock");
    }
    handleShowControls() {
        this.showControlsUI();
    }
    handleEndDayCheat() {
        this.elapsedTime = this.countDownTimer.getTotalTime();
    }
    //handling cheats
    handleInfiniteHealth() {
        // console.log("INSIDE INFINITE HEALTH")
        console.log(this.battlers);
        this.battlers[0].health = 9999999;
        this.battlers[0].maxHealth = 9999999;
        this.healthbars.get(this.battlers[0].id).visible = false;
        // console.log(this.battlers);
    }
    /**
     * Handles an NPC being killed by unregistering the NPC from the scenes subsystems
     * @param event an NPC-killed event
     */
    handleBattlerKilled(event) {
        let id = event.data.get("id");
        let battler = this.battlers.find((b) => b.id === id);
        if (battler) {
            battler.battlerActive = false;
            this.healthbars.get(id).visible = false;
        }
    }
    initializeUI() {
        //timer
        this.timerLabel = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "timer", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x, 15),
            text: "00:00",
        });
        // Remove the font-related line if you don't have custom fonts
        this.timerLabel.borderColor = Color_1.default.WHITE;
        this.timerLabel.textColor = Color_1.default.WHITE;
        this.timerLabel.backgroundColor = Color_1.default.BLACK;
        this.timerLabel.fontSize = 32;
        //Materials Icon
        this.materialIcon = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "Counters");
        this.materialIcon.scale.set(0.5, 0.5);
        this.materialIcon.position.set(this.viewport.getHalfSize().x + this.viewport.getHalfSize().x / 3, 15);
        //Material Counter
        this.materialCounter = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Counters", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x +
                this.viewport.getHalfSize().x / 3 +
                20, 15),
            text: "0",
        });
        //Fuel Icon
        this.fuelIcon = this.add.sprite(MainHW4Scene.FUEL_KEY, "Counters");
        this.fuelIcon.scale.set(0.6, 0.6);
        this.fuelIcon.position.set(this.viewport.getHalfSize().x + 2 * (this.viewport.getHalfSize().x / 3), 13);
        //Fuel Counter
        this.fuelCounter = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Counters", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x +
                2 * (this.viewport.getHalfSize().x / 3) +
                20, 15),
            text: "0",
        });
    }
    initPauseUI() {
        const center = this.viewport.getCenter();
        // Background
        this.pause_background = this.add.sprite(MainHW4Scene.PAUSE_BG_KEY, "Pause");
        const imageSize = this.pause_background.size;
        const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
        const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
        this.pause_background.scale.set(scaleX, scaleY);
        this.pause_background.position.copy(center).sub(this.viewport.getOrigin());
        // Logo
        this.logo = this.add.sprite(MainHW4Scene.LOGO_KEY, "Pause");
        // this.logo.scale.set(1, 1);
        this.logo.position.set(this.viewport.getHalfSize().x, 70);
        this.backButton = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "Pause", {
            position: new Vec2_1.default(center.x - this.viewport.getHalfSize().x + 50, center.y - this.viewport.getHalfSize().y + 25).sub(this.viewport.getOrigin()),
            text: "X",
        });
        this.backButton.size.set(150, 50);
        this.backButton.borderWidth = 2;
        this.backButton.borderColor = Color_1.default.WHITE;
        this.backButton.backgroundColor = Color_1.default.BLACK;
        this.backButton.onClickEventId = "unPause";
        this.resume = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x, 160),
            text: "Resume",
        });
        this.resume.textColor = Color_1.default.RED;
        this.resume.fontSize = 32;
        this.resume.onClickEventId = "unPause";
        this.controls = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x, 180),
            text: "Controls",
        });
        this.controls.textColor = Color_1.default.WHITE;
        this.controls.fontSize = 32;
        this.controls.onClickEventId = "showControls";
        this.exit = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x, 200),
            text: "Exit",
        });
        this.exit.textColor = Color_1.default.RED;
        this.exit.fontSize = 32;
        this.exit.onClickEventId = "exit";
        this.cheats = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x, 220),
            text: "Cheats",
        });
        this.cheats.textColor = Color_1.default.WHITE;
        this.cheats.fontSize = 32;
        this.cheats.onClickEventId = "showCheats";
        // this.AllLevelsCheat = <Button>this.add.uiElement(UIElementType.BUTTON, "Pause", {
        //   position: new Vec2(this.viewport.getHalfSize().x / 7, this.viewport.getHalfSize().y * 2 - (3*(this.viewport.getHalfSize().y / 8))),
        //   text: "All Levels",
        // });
        // this.AllLevelsCheat.textColor = Color.WHITE;
        // this.AllLevelsCheat.backgroundColor = Color.BLACK;
        // this.AllLevelsCheat.fontSize = 24;
        // this.AllLevelsCheat.onClickEventId = "allLevelCheatUnlock";
        this.unlimitedHealthCheat = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x / 7 + Text.length, this.viewport.getHalfSize().y * 2 - (2 * (this.viewport.getHalfSize().y / 8))),
            text: "[9] - Unlimited Health",
        });
        this.unlimitedHealthCheat.textColor = Color_1.default.WHITE;
        // this.unlimitedHealthCheat.backgroundColor = Color.BLACK;
        this.unlimitedHealthCheat.fontSize = 15;
        this.endCycleCheat = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x / 7 + Text.length, this.viewport.getHalfSize().y * 2 - (this.viewport.getHalfSize().y / 8)),
            text: "[8] - End day/night",
        });
        this.endCycleCheat.textColor = Color_1.default.WHITE;
        // this.endCycleCheat.backgroundColor = Color.BLACK;
        this.endCycleCheat.fontSize = 15;
        this.upLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (7 * (this.viewport.getHalfSize().y / 8))),
            text: "[W] - Up",
        });
        this.upLabel.textColor = Color_1.default.WHITE;
        this.upLabel.fontSize = 16;
        this.downLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (6 * (this.viewport.getHalfSize().y / 8))),
            text: "[S] - Down",
        });
        this.downLabel.textColor = Color_1.default.WHITE;
        this.downLabel.fontSize = 16;
        this.leftLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (5 * (this.viewport.getHalfSize().y / 8))),
            text: "[A] - Left",
        });
        this.leftLabel.textColor = Color_1.default.WHITE;
        this.leftLabel.fontSize = 16;
        this.rightLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (4 * (this.viewport.getHalfSize().y / 8))),
            text: "[D] - Right",
        });
        this.rightLabel.textColor = Color_1.default.WHITE;
        this.rightLabel.fontSize = 16;
        this.shootLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (3 * (this.viewport.getHalfSize().y / 8))),
            text: "[Left Click] - Shoot",
        });
        this.shootLabel.textColor = Color_1.default.WHITE;
        this.shootLabel.fontSize = 16;
        this.pickupLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (2 * (this.viewport.getHalfSize().y / 8))),
            text: "[E] - Pickup",
        });
        this.pickupLabel.textColor = Color_1.default.WHITE;
        this.pickupLabel.fontSize = 16;
        this.pauseLabel = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "Pause", {
            position: new Vec2_1.default(this.viewport.getHalfSize().x * 3 / 2, this.viewport.getHalfSize().y * 2 - (1 * (this.viewport.getHalfSize().y / 8))),
            text: "[ESC] - Pause",
        });
        this.pauseLabel.textColor = Color_1.default.WHITE;
        this.pauseLabel.fontSize = 16;
        this.hidePauseUI();
    }
    showPauseUI() {
        this.pause_background.visible = true;
        this.logo.visible = true;
        this.backButton.visible = true;
        this.resume.visible = true;
        this.controls.visible = true;
        this.exit.visible = true;
        this.cheats.visible = true;
    }
    hidePauseUI() {
        this.pause_background.visible = false;
        this.logo.visible = false;
        this.backButton.visible = false;
        this.resume.visible = false;
        this.controls.visible = false;
        this.exit.visible = false;
        this.cheats.visible = false;
        this.hideCheatsUI();
        this.hideControlsUI();
    }
    showCheatsUI() {
        this.unlimitedHealthCheat.visible = true;
        // this.AllLevelsCheat.visible = true;
        this.endCycleCheat.visible = true;
    }
    hideCheatsUI() {
        this.unlimitedHealthCheat.visible = false;
        // this.AllLevelsCheat.visible = false;
        this.endCycleCheat.visible = false;
    }
    showControlsUI() {
        this.upLabel.visible = true;
        this.downLabel.visible = true;
        this.leftLabel.visible = true;
        this.rightLabel.visible = true;
        this.shootLabel.visible = true;
        this.pauseLabel.visible = true;
        this.pickupLabel.visible = true;
    }
    hideControlsUI() {
        this.upLabel.visible = false;
        this.downLabel.visible = false;
        this.leftLabel.visible = false;
        this.rightLabel.visible = false;
        this.shootLabel.visible = false;
        this.pauseLabel.visible = false;
        this.pickupLabel.visible = false;
    }
    resetViewportSize() {
        this.viewport.setBounds(0, 0, this.initialViewportSize.x, this.initialViewportSize.y);
        this.viewport.setZoomLevel(1);
    }
    /**
     * Initializes the player in the scene
     */
    initializePlayer() {
        let player = this.add.animatedSprite(PlayerActor_1.default, "player1", "primary");
        player.position.set(40, 40);
        player.battleGroup = 2;
        player.health = 10;
        player.maxHealth = 10;
        // player.inventory.onChange = ItemEvent.INVENTORY_CHANGED
        // this.inventoryHud = new InventoryHUD(this, player.inventory, "inventorySlot", {
        //     start: new Vec2(232, 24),
        //     slotLayer: "slots",
        //     padding: 8,
        //     itemLayer: "items"
        // });
        // Give the player physics
        player.addPhysics(new AABB_1.default(Vec2_1.default.ZERO, new Vec2_1.default(8, 8)));
        // Give the player a healthbar
        let healthbar = new HealthbarHUD_1.default(this, player, "primary", {
            size: player.size.clone().scaled(2, 1 / 2),
            offset: player.size.clone().scaled(0, -1 / 2),
        });
        this.healthbars.set(player.id, healthbar);
        // Give the player PlayerAI
        player.addAI(PlayerAI_1.default, {
            weaponSystem: this.playerWeaponSystem,
        });
        // Start the player in the "IDLE" animation
        player.animation.play("IDLE");
        this.battlers.push(player);
        this.viewport.follow(player);
    }
    /**
     * Initialize the NPCs
     */
    initializeNPCs() {
        // Get the object data for the red enemies
        //let red = this.load.getObject("red");
        // Get the object data for the blue enemies
        let blue = this.load.getObject("blue");
        // Initialize the blue enemies
        for (let i = 0; i < blue.enemies.length; i++) {
            let npc = this.add.animatedSprite(NPCActor_1.default, "BlueEnemy", "primary");
            npc.position.set(blue.enemies[i][0], blue.enemies[i][1]);
            npc.addPhysics(new AABB_1.default(Vec2_1.default.ZERO, new Vec2_1.default(7, 7)), null, false);
            // Give the NPCS their healthbars
            let healthbar = new HealthbarHUD_1.default(this, npc, "primary", {
                size: npc.size.clone().scaled(2, 1 / 2),
                offset: npc.size.clone().scaled(0, -1 / 2),
            });
            this.healthbars.set(npc.id, healthbar);
            npc.battleGroup = 1;
            npc.speed = 10;
            npc.health = 1;
            npc.maxHealth = 10;
            npc.navkey = "navmesh";
            // Give the NPCs their AI
            // npc.addAI(ZombieBehavior, { target: this.battlers[0], range: 10000 });
            // Play the NPCs "IDLE" animation
            npc.animation.play("IDLE");
            this.battlers.push(npc);
        }
        // Initialize the blue healers
        /*for (let i = 0; i < blue.healers.length; i++) {
                
                let npc = this.add.animatedSprite(NPCActor, "BlueHealer", "primary");
                npc.position.set(blue.healers[i][0], blue.healers[i][1]);
                npc.addPhysics(new AABB(Vec2.ZERO, new Vec2(7, 7)), null, false);
    
                npc.battleGroup = 2;
                npc.speed = 10;
                npc.health = 1;
                npc.maxHealth = 10;
                npc.navkey = "navmesh";
    
                let healthbar = new HealthbarHUD(this, npc, "primary", {size: npc.size.clone().scaled(2, 1/2), offset: npc.size.clone().scaled(0, -1/2)});
                this.healthbars.set(npc.id, healthbar);
    
                npc.addAI(HealerBehavior);
                npc.animation.play("IDLE");
                this.battlers.push(npc);
            }*/
    }
    /**
     * Initialize the items in the scene (healthpacks and laser guns)
     */
    //Initialize the items Material and Fuels
    initializeItems() {
        let materials = this.load.getObject("materials");
        this.materials = new Array(materials.items.length);
        for (let i = 0; i < materials.items.length; i++) {
            let sprite = this.add.sprite(MainHW4Scene.MATERIAL_KEY, "primary");
            sprite.scale.set(0.5, 0.5);
            this.materials[i] = new Material_1.default(sprite);
            this.materials[i].position.set(materials.items[i][0], materials.items[i][1]);
        }
        let fuels = this.load.getObject("fuels");
        this.fuels = new Array(fuels.items.length);
        for (let i = 0; i < fuels.items.length; i++) {
            let sprite = this.add.sprite(MainHW4Scene.FUEL_KEY, "primary");
            sprite.scale.set(0.5, 0.5);
            this.fuels[i] = new Fuel_1.default(sprite);
            this.fuels[i].position.set(fuels.items[i][0], fuels.items[i][1]);
        }
    }
    /**
     * Initializes the navmesh graph used by the NPCs in the HW3Scene. This method is a little buggy, and
     * and it skips over some of the positions on the tilemap. If you can fix my navmesh generation algorithm,
     * go for it.
     *
     * - Peter
     */
    initializeNavmesh() {
        // Create the graph
        this.graph = new PositionGraph_1.default();
        let dim = this.walls.getDimensions();
        for (let i = 0; i < dim.y; i++) {
            for (let j = 0; j < dim.x; j++) {
                let tile = this.walls.getTileCollider(j, i);
                this.graph.addPositionedNode(tile.center);
            }
        }
        let rc;
        for (let i = 0; i < this.graph.numVertices; i++) {
            rc = this.walls.getTileColRow(i);
            if (!this.walls.isTileCollidable(rc.x, rc.y) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x - 1, 0, dim.x - 1), rc.y) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x + 1, 0, dim.x - 1), rc.y) &&
                !this.walls.isTileCollidable(rc.x, MathUtils_1.default.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !this.walls.isTileCollidable(rc.x, MathUtils_1.default.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x + 1, 0, dim.x - 1), MathUtils_1.default.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x - 1, 0, dim.x - 1), MathUtils_1.default.clamp(rc.y + 1, 0, dim.y - 1)) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x + 1, 0, dim.x - 1), MathUtils_1.default.clamp(rc.y - 1, 0, dim.y - 1)) &&
                !this.walls.isTileCollidable(MathUtils_1.default.clamp(rc.x - 1, 0, dim.x - 1), MathUtils_1.default.clamp(rc.y - 1, 0, dim.y - 1))) {
                // Create edge to the left
                rc = this.walls.getTileColRow(i + 1);
                if ((i + 1) % dim.x !== 0 && !this.walls.isTileCollidable(rc.x, rc.y)) {
                    this.graph.addEdge(i, i + 1);
                    // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + 1)})
                }
                // Create edge below
                rc = this.walls.getTileColRow(i + dim.x);
                if (i + dim.x < this.graph.numVertices &&
                    !this.walls.isTileCollidable(rc.x, rc.y)) {
                    this.graph.addEdge(i, i + dim.x);
                    // this.add.graphic(GraphicType.LINE, "graph", {start: this.graph.getNodePosition(i), end: this.graph.getNodePosition(i + dim.x)})
                }
            }
        }
        // Set this graph as a navigable entity
        let navmesh = new Navmesh_1.default(this.graph);
        // Add different strategies to use for this navmesh
        navmesh.registerStrategy("direct", new DirectStrategy_1.default(navmesh));
        navmesh.registerStrategy("astar", new AstarStrategy_1.default(navmesh));
        // Select A* as our navigation strategy
        navmesh.setStrategy("astar");
        // Add this navmesh to the navigation manager
        this.navManager.addNavigableEntity("navmesh", navmesh);
    }
    getBattlers() {
        return this.battlers;
    }
    getWalls() {
        return this.walls;
    }
    getHealthpacks() {
        return this.healthpacks;
    }
    getLaserGuns() {
        return this.laserguns;
    }
    /**
     * Checks if the given target position is visible from the given position.
     * @param position
     * @param target
     * @returns
     */
    isTargetVisible(position, target) {
        // Get the new player location
        let start = position.clone();
        let delta = target.clone().sub(start);
        // Iterate through the tilemap region until we find a collision
        let minX = Math.min(start.x, target.x);
        let maxX = Math.max(start.x, target.x);
        let minY = Math.min(start.y, target.y);
        let maxY = Math.max(start.y, target.y);
        // Get the wall tilemap
        let walls = this.getWalls();
        let minIndex = walls.getTilemapPosition(minX, minY);
        let maxIndex = walls.getTilemapPosition(maxX, maxY);
        let tileSize = walls.getScaledTileSize();
        for (let col = minIndex.x; col <= maxIndex.x; col++) {
            for (let row = minIndex.y; row <= maxIndex.y; row++) {
                if (walls.isTileCollidable(col, row)) {
                    // Get the position of this tile
                    let tilePos = new Vec2_1.default(col * tileSize.x + tileSize.x / 2, row * tileSize.y + tileSize.y / 2);
                    // Create a collider for this tile
                    let collider = new AABB_1.default(tilePos, tileSize.scaled(1 / 2));
                    let hit = collider.intersectSegment(start, delta, Vec2_1.default.ZERO);
                    if (hit !== null &&
                        start.distanceSqTo(hit.pos) < start.distanceSqTo(target)) {
                        // We hit a wall, we can't see the player
                        return false;
                    }
                }
            }
        }
        return true;
    }
}
exports.default = MainHW4Scene;
MainHW4Scene.MATERIAL_KEY = "MATERIAL";
MainHW4Scene.MATERIAL_PATH = "assets/sprites/loot.png";
MainHW4Scene.FUEL_KEY = "FUEL";
MainHW4Scene.FUEL_PATH = "assets/sprites/fuel.png";
MainHW4Scene.PAUSE_BG_KEY = "PAUSE_BG";
MainHW4Scene.PAUSE_BG_PATH = "assets/sprites/pauseBg.jpg";
MainHW4Scene.LOGO_KEY = "LOGO";
MainHW4Scene.LOGO_PATH = "assets/sprites/logo.png";
MainHW4Scene.NIGHT_KEY = "NIGHT";
MainHW4Scene.NIGHT_PATH = "assets/sprites/black.png";
},{"../../../Wolfie2D/DataTypes/Graphs/PositionGraph":11,"../../../Wolfie2D/DataTypes/Shapes/AABB":17,"../../../Wolfie2D/DataTypes/Vec2":23,"../../../Wolfie2D/Input/Input":31,"../../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../../Wolfie2D/Pathfinding/Navmesh":60,"../../../Wolfie2D/Pathfinding/Strategies/DirectStrategy":61,"../../../Wolfie2D/Timing/Timer":102,"../../../Wolfie2D/Utils/Color":104,"../../../Wolfie2D/Utils/MathUtils":107,"../../AI/Player/PlayerAI":112,"../../AI/Player/PlayerWeapon":119,"../../Actors/NPCActor":120,"../../Actors/PlayerActor":121,"../../Custom/Shaders/SpotLightShader":123,"../../Events":124,"../../GameSystems/HUD/HealthbarHUD":126,"../../GameSystems/ItemSystem/Items/Fuel":129,"../../GameSystems/ItemSystem/Items/Material":130,"../../GameSystems/Searching/HW4Reducers":131,"../../Pathfinding/AstarStrategy":134,"../MainMenu":142,"./HW4Scene":138}],142:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
const UIElementTypes_1 = require("../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Scene_1 = __importDefault(require("../../Wolfie2D/Scene/Scene"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const LevelSelectionScene_1 = __importDefault(require("./LevelSelectionScene"));
const Controls_1 = __importDefault(require("./Controls"));
const Help_1 = __importDefault(require("./Help"));
const Level1_1 = __importDefault(require("./Levels/Level1"));
class MainMenu extends Scene_1.default {
    loadScene() {
        this.load.image(MainMenu.BACKGROUND_KEY, MainMenu.BACKGROUND_PATH);
        this.load.image(MainMenu.LOGO_KEY, MainMenu.LOGO_PATH);
    }
    startScene() {
        const center = this.viewport.getCenter();
        console.log(center);
        const size = this.viewport.getHalfSize();
        console.log(size.x, size.y);
        this.addLayer("BACKGROUND", 0);
        this.initBackground();
        this.addLayer("LOGO", 1);
        this.initLogo();
        // The main menu
        this.mainMenu = this.addUILayer("mainMenu");
        //Play Button
        const play = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "mainMenu", {
            position: new Vec2_1.default(center.x - (center.x * 5) / 10, center.y + (center.y * 8) / 10),
            text: "Play",
        });
        play.size.set(300, 50);
        play.textColor = Color_1.default.RED;
        play.borderWidth = 2;
        play.borderColor = Color_1.default.WHITE;
        play.backgroundColor = Color_1.default.BLACK;
        play.onClickEventId = "play";
        //Level Selection
        const selectLevel = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 4 / 10, center.y + center.y * 3 / 10),
            text: "Level Selection",
        });
        // play.setTextColor(Color.BLACK);
        selectLevel.size.set(300, 50);
        selectLevel.borderWidth = 2;
        selectLevel.borderColor = Color_1.default.WHITE;
        selectLevel.backgroundColor = Color_1.default.BLACK;
        selectLevel.onClickEventId = "Level Selection";
        const controls = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 4 / 10, center.y + center.y * 50 / 100),
            text: "Controls",
        });
        controls.size.set(300, 50);
        controls.borderWidth = 2;
        controls.borderColor = Color_1.default.WHITE;
        controls.backgroundColor = Color_1.default.BLACK;
        controls.onClickEventId = "controls";
        const help = this.add.uiElement(UIElementTypes_1.UIElementType.BUTTON, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 4 / 10, center.y + center.y * 70 / 100),
            text: "Help",
        });
        help.size.set(300, 50);
        help.borderWidth = 2;
        help.borderColor = Color_1.default.WHITE;
        help.backgroundColor = Color_1.default.BLACK;
        help.onClickEventId = "help";
        //Credit
        const creditK = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 8 / 10, center.y - center.y * 8 / 10),
            text: "Kevin Liu",
        });
        creditK.textColor = Color_1.default.WHITE;
        const creditJ = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 8 / 10, center.y - center.y * 65 / 100),
            text: "Joey Chan",
        });
        creditJ.textColor = Color_1.default.WHITE;
        const creditL = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "mainMenu", {
            position: new Vec2_1.default(center.x + center.x * 8 / 10, center.y - center.y * 50 / 100),
            text: "Luigi Razon",
        });
        creditL.textColor = Color_1.default.WHITE;
        // Subscribe to the button events
        this.receiver.subscribe("play");
        this.receiver.subscribe("Level Selection");
        this.receiver.subscribe("controls");
        this.receiver.subscribe("help");
    }
    updateScene() {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case "play": {
                this.sceneManager.changeToScene(Level1_1.default);
                break;
            }
            case "controls": {
                this.sceneManager.changeToScene(Controls_1.default);
                break;
            }
            case "help": {
                this.sceneManager.changeToScene(Help_1.default);
                break;
            }
            case "Level Selection": {
                this.sceneManager.changeToScene(LevelSelectionScene_1.default);
                break;
            }
        }
    }
    initBackground() {
        this.background = this.add.sprite(MainMenu.BACKGROUND_KEY, "BACKGROUND");
        const center = this.viewport.getCenter();
        const imageSize = this.background.size;
        // Calculate the scale factors for the X and Y dimensions
        const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
        const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
        // // Set the scale of the background image to match the viewport dimensions
        this.background.scale.set(scaleX, scaleY);
        //Revert the viewport halfsize
        this.background.position.copy(center);
    }
    initLogo() {
        this.logo = this.add.sprite(MainMenu.LOGO_KEY, "LOGO");
        const center = this.viewport.getCenter();
        // Calculate the desired scale based on the viewport dimensions
        const scaleFactor = Math.min((center.x * 2) / 1280, (center.y * 2) / 720);
        // Use the calculated scale factor to set the logo scale
        this.logo.scale.set(5 * scaleFactor, 5 * scaleFactor);
        this.logo.position.set(center.x - (center.x * 45) / 100, center.y - (center.y * 2) / 10);
    }
}
exports.default = MainMenu;
MainMenu.BACKGROUND_KEY = "BACKGROUND";
MainMenu.BACKGROUND_PATH = "assets/sprites/background.jpg";
MainMenu.LOGO_KEY = "LOGO";
MainMenu.LOGO_PATH = "assets/sprites/logo.png";
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../Wolfie2D/Scene/Scene":98,"../../Wolfie2D/Utils/Color":104,"./Controls":135,"./Help":136,"./LevelSelectionScene":137,"./Levels/Level1":139}],143:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Vec2_1 = __importDefault(require("../../Wolfie2D/DataTypes/Vec2"));
const UIElementTypes_1 = require("../../Wolfie2D/Nodes/UIElements/UIElementTypes");
const Scene_1 = __importDefault(require("../../Wolfie2D/Scene/Scene"));
const Color_1 = __importDefault(require("../../Wolfie2D/Utils/Color"));
const MainMenu_1 = __importDefault(require("./MainMenu"));
class StartMenu extends Scene_1.default {
    loadScene() {
        this.load.image(StartMenu.BACKGROUND_KEY, StartMenu.BACKGROUND_PATH);
    }
    startScene() {
        const center = this.viewport.getCenter();
        this.addLayer("BACKGROUND", 1);
        this.initBackground();
        this.startMenu = this.addUILayer("startMenu");
        // The start menu
        const start = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "startMenu", { position: new Vec2_1.default(center.x, center.y + center.y / 1.5), text: "Click anywhere to start" });
        start.size.set(center.x * 2, center.y + center.y * 1.5 + center.y * 2);
        start.borderWidth = 2;
        start.textColor = Color_1.default.WHITE;
        start.borderColor = Color_1.default.WHITE;
        start.backgroundColor = Color_1.default.TRANSPARENT;
        start.onClickEventId = "start";
        const title = [
            "Undead",
            "Siege"
        ];
        for (let i = 0; i < title.length; i++) {
            const titleText = this.add.uiElement(UIElementTypes_1.UIElementType.LABEL, "startMenu", { position: new Vec2_1.default(center.x, center.y * .5 - 50 + i * 90), text: title[i] });
            titleText.textColor = Color_1.default.RED;
            titleText.fontSize = 80;
        }
        this.receiver.subscribe("start");
    }
    updateScene() {
        while (this.receiver.hasNextEvent()) {
            this.handleEvent(this.receiver.getNextEvent());
        }
    }
    handleEvent(event) {
        switch (event.type) {
            case "start": {
                this.sceneManager.changeToScene(MainMenu_1.default);
                break;
            }
        }
    }
    initBackground() {
        this.background = this.add.sprite(StartMenu.BACKGROUND_KEY, "BACKGROUND");
        const center = this.viewport.getCenter();
        const imageSize = this.background.size;
        // Calculate the scale factors for the X and Y dimensions
        const scaleX = (this.viewport.getHalfSize().x * 2) / imageSize.x;
        const scaleY = (this.viewport.getHalfSize().y * 2) / imageSize.y;
        // // Set the scale of the background image to match the viewport dimensions
        this.background.scale.set(scaleX, scaleY);
        //Revert the viewport halfsize
        this.background.position.copy(center);
    }
}
exports.default = StartMenu;
StartMenu.BACKGROUND_KEY = "BACKGROUND";
StartMenu.BACKGROUND_PATH = "assets/sprites/background.jpg";
},{"../../Wolfie2D/DataTypes/Vec2":23,"../../Wolfie2D/Nodes/UIElements/UIElementTypes":57,"../../Wolfie2D/Scene/Scene":98,"../../Wolfie2D/Utils/Color":104,"./MainMenu":142}],144:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Game_1 = __importDefault(require("./Wolfie2D/Loop/Game"));
const PlayerController_1 = require("./hw4/AI/Player/PlayerController");
const StartMenu_1 = __importDefault(require("./hw4/Scenes/StartMenu"));
const RegistryManager_1 = __importDefault(require("./Wolfie2D/Registry/RegistryManager"));
const SpotLightShader_1 = __importDefault(require("./hw4/Custom/Shaders/SpotLightShader"));
// The main function is your entrypoint into Wolfie2D. Specify your first scene and any options here.
(function main() {
    // Run any tests
    runTests();
    // Set up options for our game
    let options = {
        canvasSize: { x: window.innerWidth, y: window.innerHeight },
        clearColor: { r: 0.1, g: 0.1, b: 0.1 },
        inputs: [
            { name: PlayerController_1.PlayerInput.MOVE_UP, keys: ["w"] },
            { name: PlayerController_1.PlayerInput.MOVE_DOWN, keys: ["s"] },
            { name: PlayerController_1.PlayerInput.MOVE_LEFT, keys: ["a"] },
            { name: PlayerController_1.PlayerInput.MOVE_RIGHT, keys: ["d"] },
            { name: PlayerController_1.PlayerInput.PICKUP_ITEM, keys: ["e"] },
            { name: PlayerController_1.PlayerInput.DROP_ITEM, keys: ["q"] },
            { name: PlayerController_1.PlayerInput.ATTACKING, keys: ["p"] },
            { name: "slot1", keys: ["1"] },
            { name: "slot2", keys: ["2"] },
        ],
        useWebGL: false,
        showDebug: false // Whether to show debug messages. You can change this to true if you want
    };
    // Set up custom registries
    RegistryManager_1.default.shaders.registerAndPreloadItem(SpotLightShader_1.default.KEY, // The key of the shader program
    SpotLightShader_1.default, // The constructor of the shader program
    SpotLightShader_1.default.VSHADER, // The path to the vertex shader
    SpotLightShader_1.default.FSHADER); // the path to the fragment shader*/
    // Create a game with the options specified
    const game = new Game_1.default(options);
    // Start our game
    game.start(StartMenu_1.default, {});
})();
function runTests() { }
;
},{"./Wolfie2D/Loop/Game":35,"./Wolfie2D/Registry/RegistryManager":68,"./hw4/AI/Player/PlayerController":113,"./hw4/Custom/Shaders/SpotLightShader":123,"./hw4/Scenes/StartMenu":143}]},{},[144])