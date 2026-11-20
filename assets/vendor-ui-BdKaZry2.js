function Ce(k){return k&&k.__esModule&&Object.prototype.hasOwnProperty.call(k,"default")?k.default:k}var le={exports:{}},h={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var de;function Se(){if(de)return h;de=1;var k=Symbol.for("react.element"),p=Symbol.for("react.portal"),w=Symbol.for("react.fragment"),S=Symbol.for("react.strict_mode"),R=Symbol.for("react.profiler"),_=Symbol.for("react.provider"),O=Symbol.for("react.context"),B=Symbol.for("react.forward_ref"),q=Symbol.for("react.suspense"),P=Symbol.for("react.memo"),I=Symbol.for("react.lazy"),F=Symbol.iterator;function te(e){return e===null||typeof e!="object"?null:(e=F&&e[F]||e["@@iterator"],typeof e=="function"?e:null)}var W={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Z=Object.assign,G={};function f(e,t,a){this.props=e,this.context=t,this.refs=G,this.updater=a||W}f.prototype.isReactComponent={},f.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")},f.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function K(){}K.prototype=f.prototype;function $(e,t,a){this.props=e,this.context=t,this.refs=G,this.updater=a||W}var T=$.prototype=new K;T.constructor=$,Z(T,f.prototype),T.isPureReactComponent=!0;var X=Array.isArray,J=Object.prototype.hasOwnProperty,U={current:null},Q={key:!0,ref:!0,__self:!0,__source:!0};function Y(e,t,a){var o,c={},i=null,n=null;if(t!=null)for(o in t.ref!==void 0&&(n=t.ref),t.key!==void 0&&(i=""+t.key),t)J.call(t,o)&&!Q.hasOwnProperty(o)&&(c[o]=t[o]);var s=arguments.length-2;if(s===1)c.children=a;else if(1<s){for(var u=Array(s),y=0;y<s;y++)u[y]=arguments[y+2];c.children=u}if(e&&e.defaultProps)for(o in s=e.defaultProps,s)c[o]===void 0&&(c[o]=s[o]);return{$$typeof:k,type:e,key:i,ref:n,props:c,_owner:U.current}}function ae(e,t){return{$$typeof:k,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function N(e){return typeof e=="object"&&e!==null&&e.$$typeof===k}function ne(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(a){return t[a]})}var ee=/\/+/g;function D(e,t){return typeof e=="object"&&e!==null&&e.key!=null?ne(""+e.key):t.toString(36)}function j(e,t,a,o,c){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var n=!1;if(e===null)n=!0;else switch(i){case"string":case"number":n=!0;break;case"object":switch(e.$$typeof){case k:case p:n=!0}}if(n)return n=e,c=c(n),e=o===""?"."+D(n,0):o,X(c)?(a="",e!=null&&(a=e.replace(ee,"$&/")+"/"),j(c,t,a,"",function(y){return y})):c!=null&&(N(c)&&(c=ae(c,a+(!c.key||n&&n.key===c.key?"":(""+c.key).replace(ee,"$&/")+"/")+e)),t.push(c)),1;if(n=0,o=o===""?".":o+":",X(e))for(var s=0;s<e.length;s++){i=e[s];var u=o+D(i,s);n+=j(i,t,a,u,c)}else if(u=te(e),typeof u=="function")for(e=u.call(e),s=0;!(i=e.next()).done;)i=i.value,u=o+D(i,s++),n+=j(i,t,a,u,c);else if(i==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return n}function z(e,t,a){if(e==null)return e;var o=[],c=0;return j(e,o,"","",function(i){return t.call(a,i,c++)}),o}function re(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(a){(e._status===0||e._status===-1)&&(e._status=1,e._result=a)},function(a){(e._status===0||e._status===-1)&&(e._status=2,e._result=a)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var M={current:null},V={transition:null},oe={ReactCurrentDispatcher:M,ReactCurrentBatchConfig:V,ReactCurrentOwner:U};function r(){throw Error("act(...) is not supported in production builds of React.")}return h.Children={map:z,forEach:function(e,t,a){z(e,function(){t.apply(this,arguments)},a)},count:function(e){var t=0;return z(e,function(){t++}),t},toArray:function(e){return z(e,function(t){return t})||[]},only:function(e){if(!N(e))throw Error("React.Children.only expected to receive a single React element child.");return e}},h.Component=f,h.Fragment=w,h.Profiler=R,h.PureComponent=$,h.StrictMode=S,h.Suspense=q,h.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=oe,h.act=r,h.cloneElement=function(e,t,a){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var o=Z({},e.props),c=e.key,i=e.ref,n=e._owner;if(t!=null){if(t.ref!==void 0&&(i=t.ref,n=U.current),t.key!==void 0&&(c=""+t.key),e.type&&e.type.defaultProps)var s=e.type.defaultProps;for(u in t)J.call(t,u)&&!Q.hasOwnProperty(u)&&(o[u]=t[u]===void 0&&s!==void 0?s[u]:t[u])}var u=arguments.length-2;if(u===1)o.children=a;else if(1<u){s=Array(u);for(var y=0;y<u;y++)s[y]=arguments[y+2];o.children=s}return{$$typeof:k,type:e.type,key:c,ref:i,props:o,_owner:n}},h.createContext=function(e){return e={$$typeof:O,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:_,_context:e},e.Consumer=e},h.createElement=Y,h.createFactory=function(e){var t=Y.bind(null,e);return t.type=e,t},h.createRef=function(){return{current:null}},h.forwardRef=function(e){return{$$typeof:B,render:e}},h.isValidElement=N,h.lazy=function(e){return{$$typeof:I,_payload:{_status:-1,_result:e},_init:re}},h.memo=function(e,t){return{$$typeof:P,type:e,compare:t===void 0?null:t}},h.startTransition=function(e){var t=V.transition;V.transition={};try{e()}finally{V.transition=t}},h.unstable_act=r,h.useCallback=function(e,t){return M.current.useCallback(e,t)},h.useContext=function(e){return M.current.useContext(e)},h.useDebugValue=function(){},h.useDeferredValue=function(e){return M.current.useDeferredValue(e)},h.useEffect=function(e,t){return M.current.useEffect(e,t)},h.useId=function(){return M.current.useId()},h.useImperativeHandle=function(e,t,a){return M.current.useImperativeHandle(e,t,a)},h.useInsertionEffect=function(e,t){return M.current.useInsertionEffect(e,t)},h.useLayoutEffect=function(e,t){return M.current.useLayoutEffect(e,t)},h.useMemo=function(e,t){return M.current.useMemo(e,t)},h.useReducer=function(e,t,a){return M.current.useReducer(e,t,a)},h.useRef=function(e){return M.current.useRef(e)},h.useState=function(e){return M.current.useState(e)},h.useSyncExternalStore=function(e,t,a){return M.current.useSyncExternalStore(e,t,a)},h.useTransition=function(){return M.current.useTransition()},h.version="18.3.1",h}var fe;function Re(){return fe||(fe=1,le.exports=Se()),le.exports}var H=Re();const ze=Ce(H);var ie={};(function k(p,w,S,R){var _=!!(p.Worker&&p.Blob&&p.Promise&&p.OffscreenCanvas&&p.OffscreenCanvasRenderingContext2D&&p.HTMLCanvasElement&&p.HTMLCanvasElement.prototype.transferControlToOffscreen&&p.URL&&p.URL.createObjectURL),O=typeof Path2D=="function"&&typeof DOMMatrix=="function",B=(function(){if(!p.OffscreenCanvas)return!1;try{var r=new OffscreenCanvas(1,1),e=r.getContext("2d");e.fillRect(0,0,1,1);var t=r.transferToImageBitmap();e.createPattern(t,"no-repeat")}catch{return!1}return!0})();function q(){}function P(r){var e=w.exports.Promise,t=e!==void 0?e:p.Promise;return typeof t=="function"?new t(r):(r(q,q),null)}var I=(function(r,e){return{transform:function(t){if(r)return t;if(e.has(t))return e.get(t);var a=new OffscreenCanvas(t.width,t.height),o=a.getContext("2d");return o.drawImage(t,0,0),e.set(t,a),a},clear:function(){e.clear()}}})(B,new Map),F=(function(){var r=Math.floor(16.666666666666668),e,t,a={},o=0;return typeof requestAnimationFrame=="function"&&typeof cancelAnimationFrame=="function"?(e=function(c){var i=Math.random();return a[i]=requestAnimationFrame(function n(s){o===s||o+r-1<s?(o=s,delete a[i],c()):a[i]=requestAnimationFrame(n)}),i},t=function(c){a[c]&&cancelAnimationFrame(a[c])}):(e=function(c){return setTimeout(c,r)},t=function(c){return clearTimeout(c)}),{frame:e,cancel:t}})(),te=(function(){var r,e,t={};function a(o){function c(i,n){o.postMessage({options:i||{},callback:n})}o.init=function(n){var s=n.transferControlToOffscreen();o.postMessage({canvas:s},[s])},o.fire=function(n,s,u){if(e)return c(n,null),e;var y=Math.random().toString(36).slice(2);return e=P(function(v){function m(g){g.data.callback===y&&(delete t[y],o.removeEventListener("message",m),e=null,I.clear(),u(),v())}o.addEventListener("message",m),c(n,y),t[y]=m.bind(null,{data:{callback:y}})}),e},o.reset=function(){o.postMessage({reset:!0});for(var n in t)t[n](),delete t[n]}}return function(){if(r)return r;if(!S&&_){var o=["var CONFETTI, SIZE = {}, module = {};","("+k.toString()+")(this, module, true, SIZE);","onmessage = function(msg) {","  if (msg.data.options) {","    CONFETTI(msg.data.options).then(function () {","      if (msg.data.callback) {","        postMessage({ callback: msg.data.callback });","      }","    });","  } else if (msg.data.reset) {","    CONFETTI && CONFETTI.reset();","  } else if (msg.data.resize) {","    SIZE.width = msg.data.resize.width;","    SIZE.height = msg.data.resize.height;","  } else if (msg.data.canvas) {","    SIZE.width = msg.data.canvas.width;","    SIZE.height = msg.data.canvas.height;","    CONFETTI = module.exports.create(msg.data.canvas);","  }","}"].join(`
`);try{r=new Worker(URL.createObjectURL(new Blob([o])))}catch(c){return typeof console<"u"&&typeof console.warn=="function"&&console.warn("🎊 Could not load worker",c),null}a(r)}return r}})(),W={particleCount:50,angle:90,spread:45,startVelocity:45,decay:.9,gravity:1,drift:0,ticks:200,x:.5,y:.5,shapes:["square","circle"],zIndex:100,colors:["#26ccff","#a25afd","#ff5e7e","#88ff5a","#fcff42","#ffa62d","#ff36ff"],disableForReducedMotion:!1,scalar:1};function Z(r,e){return e?e(r):r}function G(r){return r!=null}function f(r,e,t){return Z(r&&G(r[e])?r[e]:W[e],t)}function K(r){return r<0?0:Math.floor(r)}function $(r,e){return Math.floor(Math.random()*(e-r))+r}function T(r){return parseInt(r,16)}function X(r){return r.map(J)}function J(r){var e=String(r).replace(/[^0-9a-f]/gi,"");return e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]),{r:T(e.substring(0,2)),g:T(e.substring(2,4)),b:T(e.substring(4,6))}}function U(r){var e=f(r,"origin",Object);return e.x=f(e,"x",Number),e.y=f(e,"y",Number),e}function Q(r){r.width=document.documentElement.clientWidth,r.height=document.documentElement.clientHeight}function Y(r){var e=r.getBoundingClientRect();r.width=e.width,r.height=e.height}function ae(r){var e=document.createElement("canvas");return e.style.position="fixed",e.style.top="0px",e.style.left="0px",e.style.pointerEvents="none",e.style.zIndex=r,e}function N(r,e,t,a,o,c,i,n,s){r.save(),r.translate(e,t),r.rotate(c),r.scale(a,o),r.arc(0,0,1,i,n,s),r.restore()}function ne(r){var e=r.angle*(Math.PI/180),t=r.spread*(Math.PI/180);return{x:r.x,y:r.y,wobble:Math.random()*10,wobbleSpeed:Math.min(.11,Math.random()*.1+.05),velocity:r.startVelocity*.5+Math.random()*r.startVelocity,angle2D:-e+(.5*t-Math.random()*t),tiltAngle:(Math.random()*(.75-.25)+.25)*Math.PI,color:r.color,shape:r.shape,tick:0,totalTicks:r.ticks,decay:r.decay,drift:r.drift,random:Math.random()+2,tiltSin:0,tiltCos:0,wobbleX:0,wobbleY:0,gravity:r.gravity*3,ovalScalar:.6,scalar:r.scalar,flat:r.flat}}function ee(r,e){e.x+=Math.cos(e.angle2D)*e.velocity+e.drift,e.y+=Math.sin(e.angle2D)*e.velocity+e.gravity,e.velocity*=e.decay,e.flat?(e.wobble=0,e.wobbleX=e.x+10*e.scalar,e.wobbleY=e.y+10*e.scalar,e.tiltSin=0,e.tiltCos=0,e.random=1):(e.wobble+=e.wobbleSpeed,e.wobbleX=e.x+10*e.scalar*Math.cos(e.wobble),e.wobbleY=e.y+10*e.scalar*Math.sin(e.wobble),e.tiltAngle+=.1,e.tiltSin=Math.sin(e.tiltAngle),e.tiltCos=Math.cos(e.tiltAngle),e.random=Math.random()+2);var t=e.tick++/e.totalTicks,a=e.x+e.random*e.tiltCos,o=e.y+e.random*e.tiltSin,c=e.wobbleX+e.random*e.tiltCos,i=e.wobbleY+e.random*e.tiltSin;if(r.fillStyle="rgba("+e.color.r+", "+e.color.g+", "+e.color.b+", "+(1-t)+")",r.beginPath(),O&&e.shape.type==="path"&&typeof e.shape.path=="string"&&Array.isArray(e.shape.matrix))r.fill(M(e.shape.path,e.shape.matrix,e.x,e.y,Math.abs(c-a)*.1,Math.abs(i-o)*.1,Math.PI/10*e.wobble));else if(e.shape.type==="bitmap"){var n=Math.PI/10*e.wobble,s=Math.abs(c-a)*.1,u=Math.abs(i-o)*.1,y=e.shape.bitmap.width*e.scalar,v=e.shape.bitmap.height*e.scalar,m=new DOMMatrix([Math.cos(n)*s,Math.sin(n)*s,-Math.sin(n)*u,Math.cos(n)*u,e.x,e.y]);m.multiplySelf(new DOMMatrix(e.shape.matrix));var g=r.createPattern(I.transform(e.shape.bitmap),"no-repeat");g.setTransform(m),r.globalAlpha=1-t,r.fillStyle=g,r.fillRect(e.x-y/2,e.y-v/2,y,v),r.globalAlpha=1}else if(e.shape==="circle")r.ellipse?r.ellipse(e.x,e.y,Math.abs(c-a)*e.ovalScalar,Math.abs(i-o)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI):N(r,e.x,e.y,Math.abs(c-a)*e.ovalScalar,Math.abs(i-o)*e.ovalScalar,Math.PI/10*e.wobble,0,2*Math.PI);else if(e.shape==="star")for(var d=Math.PI/2*3,x=4*e.scalar,b=8*e.scalar,C=e.x,A=e.y,L=5,E=Math.PI/L;L--;)C=e.x+Math.cos(d)*b,A=e.y+Math.sin(d)*b,r.lineTo(C,A),d+=E,C=e.x+Math.cos(d)*x,A=e.y+Math.sin(d)*x,r.lineTo(C,A),d+=E;else r.moveTo(Math.floor(e.x),Math.floor(e.y)),r.lineTo(Math.floor(e.wobbleX),Math.floor(o)),r.lineTo(Math.floor(c),Math.floor(i)),r.lineTo(Math.floor(a),Math.floor(e.wobbleY));return r.closePath(),r.fill(),e.tick<e.totalTicks}function D(r,e,t,a,o){var c=e.slice(),i=r.getContext("2d"),n,s,u=P(function(y){function v(){n=s=null,i.clearRect(0,0,a.width,a.height),I.clear(),o(),y()}function m(){S&&!(a.width===R.width&&a.height===R.height)&&(a.width=r.width=R.width,a.height=r.height=R.height),!a.width&&!a.height&&(t(r),a.width=r.width,a.height=r.height),i.clearRect(0,0,a.width,a.height),c=c.filter(function(g){return ee(i,g)}),c.length?n=F.frame(m):v()}n=F.frame(m),s=v});return{addFettis:function(y){return c=c.concat(y),u},canvas:r,promise:u,reset:function(){n&&F.cancel(n),s&&s()}}}function j(r,e){var t=!r,a=!!f(e||{},"resize"),o=!1,c=f(e,"disableForReducedMotion",Boolean),i=_&&!!f(e||{},"useWorker"),n=i?te():null,s=t?Q:Y,u=r&&n?!!r.__confetti_initialized:!1,y=typeof matchMedia=="function"&&matchMedia("(prefers-reduced-motion)").matches,v;function m(d,x,b){for(var C=f(d,"particleCount",K),A=f(d,"angle",Number),L=f(d,"spread",Number),E=f(d,"startVelocity",Number),ve=f(d,"decay",Number),ke=f(d,"gravity",Number),me=f(d,"drift",Number),se=f(d,"colors",X),Me=f(d,"ticks",Number),ue=f(d,"shapes"),ge=f(d,"scalar"),we=!!f(d,"flat"),he=U(d),ye=C,ce=[],xe=r.width*he.x,be=r.height*he.y;ye--;)ce.push(ne({x:xe,y:be,angle:A,spread:L,startVelocity:E,color:se[ye%se.length],shape:ue[$(0,ue.length)],ticks:Me,decay:ve,gravity:ke,drift:me,scalar:ge,flat:we}));return v?v.addFettis(ce):(v=D(r,ce,s,x,b),v.promise)}function g(d){var x=c||f(d,"disableForReducedMotion",Boolean),b=f(d,"zIndex",Number);if(x&&y)return P(function(E){E()});t&&v?r=v.canvas:t&&!r&&(r=ae(b),document.body.appendChild(r)),a&&!u&&s(r);var C={width:r.width,height:r.height};n&&!u&&n.init(r),u=!0,n&&(r.__confetti_initialized=!0);function A(){if(n){var E={getBoundingClientRect:function(){if(!t)return r.getBoundingClientRect()}};s(E),n.postMessage({resize:{width:E.width,height:E.height}});return}C.width=C.height=null}function L(){v=null,a&&(o=!1,p.removeEventListener("resize",A)),t&&r&&(document.body.contains(r)&&document.body.removeChild(r),r=null,u=!1)}return a&&!o&&(o=!0,p.addEventListener("resize",A,!1)),n?n.fire(d,C,L):m(d,C,L)}return g.reset=function(){n&&n.reset(),v&&v.reset()},g}var z;function re(){return z||(z=j(null,{useWorker:!0,resize:!0})),z}function M(r,e,t,a,o,c,i){var n=new Path2D(r),s=new Path2D;s.addPath(n,new DOMMatrix(e));var u=new Path2D;return u.addPath(s,new DOMMatrix([Math.cos(i)*o,Math.sin(i)*o,-Math.sin(i)*c,Math.cos(i)*c,t,a])),u}function V(r){if(!O)throw new Error("path confetti are not supported in this browser");var e,t;typeof r=="string"?e=r:(e=r.path,t=r.matrix);var a=new Path2D(e),o=document.createElement("canvas"),c=o.getContext("2d");if(!t){for(var i=1e3,n=i,s=i,u=0,y=0,v,m,g=0;g<i;g+=2)for(var d=0;d<i;d+=2)c.isPointInPath(a,g,d,"nonzero")&&(n=Math.min(n,g),s=Math.min(s,d),u=Math.max(u,g),y=Math.max(y,d));v=u-n,m=y-s;var x=10,b=Math.min(x/v,x/m);t=[b,0,0,b,-Math.round(v/2+n)*b,-Math.round(m/2+s)*b]}return{type:"path",path:e,matrix:t}}function oe(r){var e,t=1,a="#000000",o='"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", "EmojiOne Color", "Android Emoji", "Twemoji Mozilla", "system emoji", sans-serif';typeof r=="string"?e=r:(e=r.text,t="scalar"in r?r.scalar:t,o="fontFamily"in r?r.fontFamily:o,a="color"in r?r.color:a);var c=10*t,i=""+c+"px "+o,n=new OffscreenCanvas(c,c),s=n.getContext("2d");s.font=i;var u=s.measureText(e),y=Math.ceil(u.actualBoundingBoxRight+u.actualBoundingBoxLeft),v=Math.ceil(u.actualBoundingBoxAscent+u.actualBoundingBoxDescent),m=2,g=u.actualBoundingBoxLeft+m,d=u.actualBoundingBoxAscent+m;y+=m+m,v+=m+m,n=new OffscreenCanvas(y,v),s=n.getContext("2d"),s.font=i,s.fillStyle=a,s.fillText(e,g,d);var x=1/t;return{type:"bitmap",bitmap:n.transferToImageBitmap(),matrix:[x,0,0,x,-y*x/2,-v*x/2]}}w.exports=function(){return re().apply(this,arguments)},w.exports.reset=function(){re().reset()},w.exports.create=j,w.exports.shapeFromPath=V,w.exports.shapeFromText=oe})((function(){return typeof window<"u"?window:typeof self<"u"?self:this||{}})(),ie,!1);const Pe=ie.exports;ie.exports.create;/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _e=k=>k.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),pe=(...k)=>k.filter((p,w,S)=>!!p&&p.trim()!==""&&S.indexOf(p)===w).join(" ").trim();/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Ee={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ae=H.forwardRef(({color:k="currentColor",size:p=24,strokeWidth:w=2,absoluteStrokeWidth:S,className:R="",children:_,iconNode:O,...B},q)=>H.createElement("svg",{ref:q,...Ee,width:p,height:p,stroke:k,strokeWidth:S?Number(w)*24/Number(p):w,className:pe("lucide",R),...B},[...O.map(([P,I])=>H.createElement(P,I)),...Array.isArray(_)?_:[_]]));/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=(k,p)=>{const w=H.forwardRef(({className:S,...R},_)=>H.createElement(Ae,{ref:_,iconNode:p,className:pe(`lucide-${_e(k)}`,S),...R}));return w.displayName=`${k}`,w};/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ie=l("ArrowUp",[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Te=l("Award",[["path",{d:"m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",key:"1yiouv"}],["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const je=l("BookOpen",[["path",{d:"M12 7v14",key:"1akyts"}],["path",{d:"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",key:"ruj8y"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Le=l("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oe=l("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qe=l("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fe=l("CircleAlert",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ve=l("CircleCheck",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const He=l("CirclePlus",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 12h8",key:"1wcyev"}],["path",{d:"M12 8v8",key:"napkw2"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Be=l("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $e=l("Crown",[["path",{d:"M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z",key:"1vdc57"}],["path",{d:"M5 21h14",key:"11awu3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=l("Eye",[["path",{d:"M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0",key:"1nclc0"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ne=l("FileCheck2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m3 15 2 2 4-4",key:"1lhrkk"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const De=l("Flame",[["path",{d:"M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z",key:"96xj49"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=l("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ze=l("Grid3x3",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ge=l("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=l("House",[["path",{d:"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",key:"5wwlr5"}],["path",{d:"M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"1d0kgt"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xe=l("Infinity",[["path",{d:"M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z",key:"1z0uae"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Je=l("KeyRound",[["path",{d:"M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",key:"1s6t7t"}],["circle",{cx:"16.5",cy:"7.5",r:".5",fill:"currentColor",key:"w0ekpg"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=l("Layers",[["path",{d:"M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",key:"zw3jo"}],["path",{d:"M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",key:"1wduqc"}],["path",{d:"M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",key:"kqbvx6"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ye=l("LoaderCircle",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const er=l("LogIn",[["path",{d:"M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4",key:"u53s6r"}],["polyline",{points:"10 17 15 12 10 7",key:"1ail0h"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rr=l("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tr=l("MailCheck",[["path",{d:"M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h8",key:"12jkf8"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}],["path",{d:"m16 19 2 2 4-4",key:"1b14m6"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ar=l("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nr=l("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const or=l("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cr=l("Mountain",[["path",{d:"m8 3 4 8 5-5 5 15H2L8 3z",key:"otkl63"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lr=l("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",fill:"currentColor",key:"1okk4w"}],["circle",{cx:"17.5",cy:"10.5",r:".5",fill:"currentColor",key:"f64h9f"}],["circle",{cx:"8.5",cy:"7.5",r:".5",fill:"currentColor",key:"fotxhn"}],["circle",{cx:"6.5",cy:"12.5",r:".5",fill:"currentColor",key:"qy21gx"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ir=l("Play",[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sr=l("Radar",[["path",{d:"M19.07 4.93A10 10 0 0 0 6.99 3.34",key:"z3du51"}],["path",{d:"M4 6h.01",key:"oypzma"}],["path",{d:"M2.29 9.62A10 10 0 1 0 21.31 8.35",key:"qzzz0"}],["path",{d:"M16.24 7.76A6 6 0 1 0 8.23 16.67",key:"1yjesh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M17.99 11.66A6 6 0 0 1 15.77 16.67",key:"1u2y91"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"m13.41 10.59 5.66-5.66",key:"mhq4k0"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ur=l("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hr=l("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yr=l("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dr=l("Save",[["path",{d:"M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",key:"1c8476"}],["path",{d:"M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7",key:"1ydtos"}],["path",{d:"M7 3v4a1 1 0 0 0 1 1h7",key:"t51u73"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fr=l("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pr=l("Send",[["path",{d:"M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",key:"1ffxy3"}],["path",{d:"m21.854 2.147-10.94 10.939",key:"12cjpa"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vr=l("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kr=l("ShieldAlert",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mr=l("ShieldCheck",[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mr=l("Sparkles",[["path",{d:"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",key:"4pj2yx"}],["path",{d:"M20 3v4",key:"1olli1"}],["path",{d:"M22 5h-4",key:"1gvqau"}],["path",{d:"M4 17v2",key:"vumght"}],["path",{d:"M5 18H3",key:"zchphs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gr=l("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wr=l("Swords",[["polyline",{points:"14.5 17.5 3 6 3 3 6 3 17.5 14.5",key:"1hfsw2"}],["line",{x1:"13",x2:"19",y1:"19",y2:"13",key:"1vrmhu"}],["line",{x1:"16",x2:"20",y1:"16",y2:"20",key:"1bron3"}],["line",{x1:"19",x2:"21",y1:"21",y2:"19",key:"13pww6"}],["polyline",{points:"14.5 6.5 18 3 21 3 21 6 17.5 9.5",key:"hbey2j"}],["line",{x1:"5",x2:"9",y1:"14",y2:"18",key:"1hf58s"}],["line",{x1:"7",x2:"4",y1:"17",y2:"20",key:"pidxm4"}],["line",{x1:"3",x2:"5",y1:"19",y2:"21",key:"1pehsh"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xr=l("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const br=l("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cr=l("TriangleAlert",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3",key:"wmoenq"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sr=l("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rr=l("UserMinus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _r=l("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Er=l("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ar=l("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zr=l("Volume2",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["path",{d:"M16 9a5 5 0 0 1 0 6",key:"1q6k2b"}],["path",{d:"M19.364 18.364a9 9 0 0 0 0-12.728",key:"ijwkga"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pr=l("VolumeX",[["path",{d:"M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z",key:"uqj9uw"}],["line",{x1:"22",x2:"16",y1:"9",y2:"15",key:"1ewh16"}],["line",{x1:"16",x2:"22",y1:"9",y2:"15",key:"5ykzw1"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ir=l("WifiOff",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}],["path",{d:"M5 12.859a10 10 0 0 1 5.17-2.69",key:"1dl1wf"}],["path",{d:"M19 12.859a10 10 0 0 0-2.007-1.523",key:"4k23kn"}],["path",{d:"M2 8.82a15 15 0 0 1 4.177-2.643",key:"1grhjp"}],["path",{d:"M22 8.82a15 15 0 0 0-11.288-3.764",key:"z3jwby"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tr=l("Wifi",[["path",{d:"M12 20h.01",key:"zekei9"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["path",{d:"M5 12.859a10 10 0 0 1 14 0",key:"1x1e6c"}],["path",{d:"M8.5 16.429a5 5 0 0 1 7 0",key:"1bycff"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jr=l("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lr=l("Zap",[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]]);export{Ve as $,Ie as A,Le as B,qe as C,Ze as D,Ue as E,De as F,We as G,Ke as H,Xe as I,ur as J,Ye as K,er as L,nr as M,He as N,Fe as O,lr as P,Qe as Q,yr as R,mr as S,Sr as T,Ar as U,zr as V,Ir as W,jr as X,br as Y,Lr as Z,tr as _,H as a,_r as a0,ar as a1,Je as a2,Oe as a3,rr as a4,dr as a5,fr as a6,Rr as a7,sr as a8,pr as b,Pe as c,Be as d,wr as e,je as f,Ce as g,Pr as h,Tr as i,Mr as j,Ge as k,hr as l,Er as m,Cr as n,gr as o,or as p,cr as q,Re as r,xr as s,kr as t,$e as u,ir as v,vr as w,Te as x,Ne as y,ze as z};
