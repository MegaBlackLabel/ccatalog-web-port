import { Fragment as e, createContext as t, forwardRef as n, useCallback as r, useContext as i, useEffect as a, useId as o, useLayoutEffect as s, useMemo as c, useRef as l, useState as u } from "react";
import { Fragment as d, jsx as f, jsxs as p } from "react/jsx-runtime";
import { createPortal as m, flushSync as h } from "react-dom";
//#region node_modules/clsx/dist/clsx.mjs
function g(e) {
	var t, n, r = "";
	if (typeof e == "string" || typeof e == "number") r += e;
	else if (typeof e == "object") {
		if (Array.isArray(e)) {
			var i = e.length;
			for (t = 0; t < i; t++) e[t] && (n = g(e[t])) && (r && (r += " "), r += n);
		} else for (n in e) e[n] && (r && (r += " "), r += n);
	}
	return r;
}
function _() {
	for (var e, t, n = 0, r = "", i = arguments.length; n < i; n++) (e = arguments[n]) && (t = g(e)) && (r && (r += " "), r += t);
	return r;
}
//#endregion
//#region src/components/FieldRow.tsx
var v = n(({ stacked: e = !1, className: t, children: n, ...r }, i) => /* @__PURE__ */ f("div", {
	ref: i,
	className: _(e ? "field-row-stacked" : "field-row", t),
	...r,
	children: n
}));
v.displayName = "FieldRow";
//#endregion
//#region src/hooks/useWindowManager.ts
function y(e = [], t = !1) {
	let [n, i] = u(() => {
		let t = {};
		return e.forEach((e, n) => {
			t[e] = {
				id: e,
				minimized: !1,
				maximized: !1,
				isSnapped: !1,
				zIndex: n + 1
			};
		}), t;
	}), [o, s] = u(null), [c, d] = u({}), [f, p] = u({}), [m, h] = u({}), [g, _] = u({}), v = l(o), y = l(c), b = l(m), x = l(g);
	a(() => {
		v.current = o;
	}, [o]), a(() => {
		y.current = c;
	}, [c]), a(() => {
		b.current = m;
	}, [m]), a(() => {
		x.current = g;
	}, [g]);
	let S = (e) => Math.max(0, ...Object.values(e).map((e) => e.zIndex)), C = r((e) => {
		i((t) => {
			if (!t[e]) return t;
			let n = S(t);
			return t[e].zIndex === n ? t : {
				...t,
				[e]: {
					...t[e],
					zIndex: n + 1
				}
			};
		}), s(e), v.current = e;
	}, []), w = r((e) => {
		i((t) => t[e] ? {
			...t,
			[e]: {
				...t[e],
				minimized: !0,
				maximized: !1
			}
		} : t);
	}, []), T = r((e) => {
		i((t) => t[e] ? {
			...t,
			[e]: {
				...t[e],
				maximized: !0,
				minimized: !1
			}
		} : t);
	}, []), E = r((e) => {
		i((t) => t[e] ? {
			...t,
			[e]: {
				...t[e],
				minimized: !1,
				maximized: !1
			}
		} : t);
	}, []), D = r((e) => {
		i((t) => {
			let n = { ...t };
			return delete n[e], n;
		}), s((t) => t === e ? null : t);
	}, []), O = r((e, t) => {
		i((n) => {
			if (n[e]) {
				let r = n[e];
				return r.title === t?.title && r.icon === t?.icon ? n : {
					...n,
					[e]: {
						...r,
						title: t?.title ?? r.title,
						icon: t?.icon ?? r.icon
					}
				};
			}
			let r = S(n), i = {
				...n,
				[e]: {
					id: e,
					minimized: !1,
					maximized: !1,
					isSnapped: !1,
					zIndex: r + 1,
					title: t?.title,
					icon: t?.icon
				}
			}, a = v.current;
			return a && a !== e && i[a] && (i[a] = {
				...i[a],
				zIndex: r + 2
			}), i;
		}), s((t) => {
			let n = t ?? e;
			return v.current = n, n;
		});
	}, []), k = r((e) => {
		i((t) => {
			if (!t[e]) return t;
			let n = { ...t };
			return delete n[e], n;
		}), s((t) => t === e ? null : t);
	}, []), A = r((e) => o === e, [o]), j = r((e, t) => {
		y.current = {
			...y.current,
			[e]: t
		}, d((n) => ({
			...n,
			[e]: t
		}));
	}, []), ee = r(() => ({ ...c }), [c]), M = r((e, t) => {
		p((n) => ({
			...n,
			[e]: t
		}));
	}, []), te = r((e) => {
		p((t) => {
			let n = { ...t };
			return delete n[e], n;
		});
	}, []), ne = r((e, t) => {
		i((n) => !n[e] || n[e].isSnapped === t ? n : {
			...n,
			[e]: {
				...n[e],
				isSnapped: t
			}
		});
	}, []), re = r((e, t) => {
		let n = b.current[e], r = x.current[e];
		n && r && n.x === t.x && n.y === t.y && n.width === t.width && n.height === t.height || (h((n) => {
			let r = n[e];
			if (r && r.x === t.x && r.y === t.y && r.width === t.width && r.height === t.height) return n;
			let i = {
				...n,
				[e]: t
			};
			return b.current = i, i;
		}), _((t) => {
			if (t[e]) return t;
			let n = y.current[e];
			if (!n) return t;
			let r = {
				...t,
				[e]: n
			};
			return x.current = r, r;
		}));
	}, []);
	return {
		windows: n,
		activeWindowId: o,
		geometries: c,
		moveRequests: f,
		resizeRequests: m,
		preShrinkGeometries: g,
		autoMoveOnSnap: t,
		focus: C,
		minimize: w,
		maximize: T,
		restore: E,
		close: D,
		register: O,
		unregister: k,
		isActive: A,
		updateGeometry: j,
		getAllGeometries: ee,
		requestMove: M,
		clearMoveRequest: te,
		requestResize: re,
		clearResizeRequest: r((e) => {
			h((t) => {
				if (!t[e]) return t;
				let n = { ...t };
				return delete n[e], b.current = n, n;
			});
		}, []),
		restoreShrink: r((e) => {
			let t = x.current[e];
			t && (re(e, t), _((t) => {
				if (!t[e]) return t;
				let n = { ...t };
				return delete n[e], x.current = n, n;
			}));
		}, [re]),
		setWindowSnapped: ne
	};
}
//#endregion
//#region src/components/window/WindowManagerContext.tsx
var b = t(null);
b.displayName = "WindowManagerContext";
function x() {
	return i(b);
}
//#endregion
//#region src/components/Win98Provider/Win98Provider.tsx
function S({ children: e, style: t, className: n, autoMoveOnSnap: r = !1, mobile: i = !1 }) {
	let a = {
		...y([], r),
		isMobile: i
	};
	return /* @__PURE__ */ f(b.Provider, {
		value: a,
		children: /* @__PURE__ */ f("div", {
			className: ["win98", n].filter(Boolean).join(" "),
			style: t,
			children: e
		})
	});
}
var C = {
	titleBar: "_titleBar_1m4va_3",
	titleBarLeft: "_titleBarLeft_1m4va_59"
}, w = n(function({ title: e, icon: t, inactive: n, onMinimize: r, onMaximize: i, onRestore: a, onClose: o, onHelp: s, maximizeDisabled: c, isMaximized: l, isMinimized: u, className: d, ...m }, h) {
	return /* @__PURE__ */ p("div", {
		ref: h,
		className: _("title-bar", C.titleBar, { inactive: n }, d),
		...m,
		children: [/* @__PURE__ */ p("div", {
			className: C.titleBarLeft,
			children: [t && /* @__PURE__ */ f("img", {
				src: t,
				alt: "",
				style: {
					width: 14,
					height: 14,
					flexShrink: 0
				}
			}), /* @__PURE__ */ f("div", {
				className: "title-bar-text",
				children: e
			})]
		}), /* @__PURE__ */ p("div", {
			className: "title-bar-controls",
			children: [
				u ? /* @__PURE__ */ f("button", {
					"aria-label": "Restore",
					onClick: r
				}) : /* @__PURE__ */ f("button", {
					"aria-label": "Minimize",
					onClick: r
				}),
				l ? /* @__PURE__ */ f("button", {
					"aria-label": "Restore",
					onClick: a
				}) : /* @__PURE__ */ f("button", {
					"aria-label": "Maximize",
					onClick: i,
					disabled: c || u
				}),
				s !== void 0 && /* @__PURE__ */ f("button", {
					"aria-label": "Help",
					onClick: s
				}),
				/* @__PURE__ */ f("button", {
					"aria-label": "Close",
					onClick: o
				})
			]
		})]
	});
});
//#endregion
//#region src/hooks/snap.ts
function T({ pointerX: e, pointerY: t, viewportWidth: n, viewportHeight: r, threshold: i, minWidth: a, minHeight: o }) {
	let s = Math.floor(n / 2), c = Math.floor(r / 2), l = e <= i, u = e >= n - i, d = t <= i, f = t >= r - i, p = null;
	if (d && l ? p = "top-left" : d && u ? p = "top-right" : f && l ? p = "bottom-left" : f && u ? p = "bottom-right" : l ? p = "left" : u ? p = "right" : d ? p = "top" : f && (p = "bottom"), !p) return null;
	let m = p === "left" ? {
		x: 0,
		y: 0,
		width: s,
		height: r
	} : p === "right" ? {
		x: s,
		y: 0,
		width: n - s,
		height: r
	} : p === "top" ? {
		x: 0,
		y: 0,
		width: n,
		height: c
	} : p === "bottom" ? {
		x: 0,
		y: c,
		width: n,
		height: r - c
	} : p === "top-left" ? {
		x: 0,
		y: 0,
		width: s,
		height: c
	} : p === "top-right" ? {
		x: s,
		y: 0,
		width: n - s,
		height: c
	} : p === "bottom-left" ? {
		x: 0,
		y: c,
		width: s,
		height: r - c
	} : {
		x: s,
		y: c,
		width: n - s,
		height: r - c
	};
	return m.width < a || m.height < o ? null : {
		...m,
		zone: p
	};
}
//#endregion
//#region src/hooks/useDraggable.ts
function E(e, t) {
	if (!t) return e;
	let n = typeof window < "u" ? window.innerWidth : 1024, r = typeof window < "u" ? window.innerHeight : 768, i = Math.max(0, n - t.width), a = Math.max(0, r - t.height);
	return {
		x: Math.max(0, Math.min(e.x, i)),
		y: Math.max(0, Math.min(e.y, a))
	};
}
function D(e) {
	let t = e?.bounds, n = l({
		snapEnabled: e?.snapEnabled,
		snapThreshold: e?.snapThreshold ?? 20,
		minWidth: e?.minWidth ?? 200,
		minHeight: e?.minHeight ?? 100,
		onSnapCommit: e?.onSnapCommit,
		onDragStart: e?.onDragStart
	}), i = c(() => E({
		x: e?.initialX ?? 50,
		y: e?.initialY ?? 50
	}, t), [
		e?.initialX,
		e?.initialY,
		t
	]), [o, s] = u(i), [d, f] = u(null), p = e?.position, m = e?.onPositionChange, g = c(() => p ? E(p, t) : o, [
		p,
		o,
		t
	]), _ = r((e) => {
		let n = E(e, t);
		m ? m(n) : s(n);
	}, [m, t]), v = l(null), y = l(null), b = l(!1), x = l(null), S = l({
		clientX: 0,
		clientY: 0
	}), C = l({
		move: () => {},
		up: () => {},
		cancel: () => {}
	}), w = l(g), D = l(null);
	n.current = {
		snapEnabled: e?.snapEnabled,
		snapThreshold: e?.snapThreshold ?? 20,
		minWidth: e?.minWidth ?? 200,
		minHeight: e?.minHeight ?? 100,
		onSnapCommit: e?.onSnapCommit,
		onDragStart: e?.onDragStart
	}, w.current = g, a(() => {
		D.current = d;
	}, [d]);
	let O = r((e) => {
		if (!v.current || e.pointerId !== v.current.pointerId) return;
		let t = e.clientX - v.current.startMouseX, r = e.clientY - v.current.startMouseY, i = {
			x: v.current.startX + t,
			y: v.current.startY + r
		};
		if (x.current = i, S.current = {
			clientX: e.clientX,
			clientY: e.clientY
		}, b.current) return;
		b.current = !0;
		let a = window.requestAnimationFrame(() => {
			if (b.current = !1, y.current = null, x.current) {
				if (_(x.current), x.current = null, n.current.snapEnabled === !1) {
					D.current !== null && (D.current = null, f(null));
					return;
				}
				let e = typeof window < "u" ? window.innerWidth : 1024, t = typeof window < "u" ? window.innerHeight : 768, r = T({
					pointerX: S.current.clientX,
					pointerY: S.current.clientY,
					viewportWidth: e,
					viewportHeight: t,
					threshold: n.current.snapThreshold,
					minWidth: n.current.minWidth,
					minHeight: n.current.minHeight
				});
				r?.zone === D.current?.zone ? D.current = r : (D.current = r, f(r));
			}
		});
		b.current && (y.current = a);
	}, [_, f]), k = r((e) => {
		let t = v.current;
		t && t.pointerId === e && (b.current && (y.current !== null && window.cancelAnimationFrame(y.current), b.current = !1, y.current = null, x.current = null), t.target.releasePointerCapture(e), window.removeEventListener("pointermove", C.current.move), window.removeEventListener("pointerup", C.current.up), window.removeEventListener("pointercancel", C.current.cancel), v.current = null, D.current = null, f(null));
	}, [f]), A = r((e) => {
		if (!v.current || e.pointerId !== v.current.pointerId) return;
		let t = D.current;
		t && n.current.snapEnabled !== !1 && n.current.onSnapCommit?.(t), k(e.pointerId);
	}, [k]), j = r((e) => {
		k(e.pointerId);
	}, [k]);
	return a(() => () => {
		v.current && k(v.current.pointerId);
	}, [k]), a(() => {
		C.current = {
			move: O,
			up: A,
			cancel: j
		};
	}, [
		O,
		A,
		j
	]), {
		position: g,
		setPosition: _,
		snapTarget: d,
		dragHandleProps: { onPointerDown: r((e) => {
			e.target.closest("button") || (h(() => {
				n.current.onDragStart?.();
			}), e.currentTarget.setPointerCapture(e.pointerId), v.current = {
				startMouseX: e.clientX,
				startMouseY: e.clientY,
				startX: w.current.x,
				startY: w.current.y,
				pointerId: e.pointerId,
				target: e.currentTarget
			}, window.addEventListener("pointermove", O), window.addEventListener("pointerup", A), window.addEventListener("pointercancel", j));
		}, [
			O,
			A,
			j
		]) }
	};
}
//#endregion
//#region src/hooks/useResizable.ts
var O = {
	n: "n-resize",
	s: "s-resize",
	e: "e-resize",
	w: "w-resize",
	ne: "ne-resize",
	sw: "sw-resize",
	nw: "nw-resize",
	se: "se-resize"
};
function k(e, t, n, r) {
	let i = typeof window < "u" ? window.innerWidth : 1024, a = typeof window < "u" ? window.innerHeight : 768, o = Math.min(n, i), s = Math.min(r, a), c = Math.max(0, i - o), l = Math.max(0, a - s);
	return {
		x: Math.max(0, Math.min(e, c)),
		y: Math.max(0, Math.min(t, l)),
		width: o,
		height: s
	};
}
function A(e) {
	let t = e?.minWidth ?? 200, n = e?.minHeight ?? 100, i = e?.clampToViewport ?? !1, o = e?.reconcileOnResize ?? !1, s = c(() => {
		let t = e?.initialWidth ?? 400, n = e?.initialHeight ?? 300, r = e?.initialX ?? 50, a = e?.initialY ?? 50;
		return i ? k(r, a, t, n) : {
			x: r,
			y: a,
			width: t,
			height: n
		};
	}, [
		e?.initialWidth,
		e?.initialHeight,
		e?.initialX,
		e?.initialY,
		i
	]), [d, f] = u({
		width: s.width,
		height: s.height
	}), [p, m] = u({
		x: s.x,
		y: s.y
	}), h = e?.position ?? p, g = e?.onPositionChange ?? m, _ = r((e) => {
		let r = Math.max(t, e.width), i = Math.max(n, e.height);
		f({
			width: r,
			height: i
		});
	}, [t, n]);
	a(() => {
		if (!o || !i) return;
		let e = () => {
			let e = k(h.x, h.y, d.width, d.height);
			(e.x !== h.x || e.y !== h.y || e.width !== d.width || e.height !== d.height) && (f({
				width: e.width,
				height: e.height
			}), g({
				x: e.x,
				y: e.y
			}));
		};
		return window.addEventListener("resize", e), () => window.removeEventListener("resize", e);
	}, [
		o,
		i,
		h,
		d,
		g
	]);
	let v = l(null), y = l(null), b = l(null), x = l(h), S = l(d);
	x.current = h, S.current = d;
	let C = l({
		move: () => {},
		up: () => {}
	});
	return C.current = {
		move: r((e) => {
			if (!v.current || e.pointerId !== v.current.pointerId) return;
			let { direction: r, startMouseX: a, startMouseY: o, startWidth: s, startHeight: c, startX: l, startY: u } = v.current, d = e.clientX - a, p = e.clientY - o, m = s, h = c, _ = l, x = u;
			r.includes("e") && (m = Math.max(t, s + d)), r.includes("s") && (h = Math.max(n, c + p)), r.includes("w") && (m = Math.max(t, s - d), _ = l + s - m), r.includes("n") && (h = Math.max(n, c - p), x = u + c - h), b.current = {
				x: _,
				y: x,
				width: m,
				height: h
			}, y.current === null && (y.current = window.requestAnimationFrame(() => {
				if (y.current = null, b.current) {
					let e = b.current;
					if (b.current = null, i) {
						let t = k(e.x, e.y, e.width, e.height);
						f({
							width: t.width,
							height: t.height
						}), g({
							x: t.x,
							y: t.y
						});
					} else f({
						width: e.width,
						height: e.height
					}), g({
						x: e.x,
						y: e.y
					});
				}
			}));
		}, [
			t,
			n,
			g,
			i
		]),
		up: r((e) => {
			v.current && e.pointerId === v.current.pointerId && (y.current !== null && (window.cancelAnimationFrame(y.current), y.current = null, b.current = null), v.current.target.releasePointerCapture(e.pointerId), window.removeEventListener("pointermove", C.current.move), window.removeEventListener("pointerup", C.current.up), v.current = null);
		}, [])
	}, a(() => () => {
		y.current !== null && (window.cancelAnimationFrame(y.current), y.current = null), window.removeEventListener("pointermove", C.current.move), window.removeEventListener("pointerup", C.current.up);
	}, []), {
		size: d,
		position: h,
		setSize: _,
		getResizeHandleProps: r((e) => ({
			style: { cursor: O[e] },
			onPointerDown: (t) => {
				t.stopPropagation(), t.currentTarget.setPointerCapture(t.pointerId), v.current = {
					direction: e,
					startMouseX: t.clientX,
					startMouseY: t.clientY,
					startWidth: S.current.width,
					startHeight: S.current.height,
					startX: x.current.x,
					startY: x.current.y,
					pointerId: t.pointerId,
					target: t.currentTarget
				}, window.addEventListener("pointermove", C.current.move), window.addEventListener("pointerup", C.current.up);
			}
		}), [])
	};
}
//#endregion
//#region src/hooks/collision.ts
var j = 8, ee = 1024, M = 768;
function te() {
	return {
		width: typeof globalThis.innerWidth == "number" ? globalThis.innerWidth : ee,
		height: typeof globalThis.innerHeight == "number" ? globalThis.innerHeight : M
	};
}
function ne(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function re(e, t, n) {
	return {
		x: ne(e.x, 0, Math.max(0, n.width - t.width)),
		y: ne(e.y, 0, Math.max(0, n.height - t.height))
	};
}
function N(e, t, n) {
	return e.x >= 0 && e.y >= 0 && e.x + t.width <= n.width && e.y + t.height <= n.height;
}
function ie(e, t) {
	return e.width <= 0 || e.height <= 0 || t.width <= 0 || t.height <= 0 ? !1 : !(e.x + e.width <= t.x || t.x + t.width <= e.x || e.y + e.height <= t.y || t.y + t.height <= e.y);
}
function ae(e, t, n) {
	let r = n.minWidth ?? 200, i = n.minHeight ?? 100;
	if (!ie(e, t)) return t;
	let a = e.x - t.x, o = e.y - t.y, s = [], c = (t) => t.width >= r && t.height >= i && !ie(e, t), l = (e) => {
		c(e) && s.push(e);
	};
	if (e.x > t.x && a >= r && l({
		x: t.x,
		y: t.y,
		width: a,
		height: t.height
	}), e.y > t.y && o >= i && l({
		x: t.x,
		y: t.y,
		width: t.width,
		height: o
	}), s.length === 0) {
		let n = t.x + t.width, r = t.y + t.height, i = e.x + e.width, a = e.y + e.height;
		l({
			x: t.x,
			y: a,
			width: t.width,
			height: r - a
		}), l({
			x: i,
			y: t.y,
			width: n - i,
			height: t.height
		}), l({
			x: i,
			y: a,
			width: n - i,
			height: r - a
		});
	}
	return s.length === 0 ? null : s.reduce((e, t) => {
		let n = e.width * e.height;
		return t.width * t.height > n ? t : e;
	});
}
function oe(e, t) {
	let n = te();
	return [
		{
			x: e.x + e.width + j,
			y: t.y
		},
		{
			x: t.x,
			y: e.y + e.height + j
		},
		{
			x: e.x - t.width - j,
			y: t.y
		},
		{
			x: t.x,
			y: e.y - t.height - j
		}
	].find((e) => N(e, t, n)) ?? re({
		x: t.x,
		y: t.y
	}, t, n);
}
var se = {
	resizeHandle: "_resizeHandle_153zr_1",
	n: "_n_153zr_13",
	s: "_s_153zr_15",
	e: "_e_153zr_17",
	w: "_w_153zr_19",
	ne: "_ne_153zr_21",
	se: "_se_153zr_23",
	sw: "_sw_153zr_25",
	nw: "_nw_153zr_27",
	sizeGrip: "_sizeGrip_153zr_43",
	snapPreview: "_snapPreview_153zr_79",
	window: "_window_153zr_117"
}, ce = [
	"n",
	"ne",
	"e",
	"se",
	"s",
	"sw",
	"w",
	"nw"
];
function le(e, t, n, r) {
	let i = typeof window < "u" ? window.innerWidth : 1024, a = typeof window < "u" ? window.innerHeight : 768, o = i < 640, s = o ? 8 : 32, c = Math.min(e, i - s), l = Math.min(t, a - s), u = Math.max(0, i - c), d = Math.max(0, a - l);
	return {
		width: c,
		height: l,
		x: Math.max(o ? 4 : 8, Math.min(n, u)),
		y: Math.max(o ? 4 : 8, Math.min(r, d))
	};
}
function P({ title: e, icon: t, children: n, statusBar: r, width: i = 400, height: s = 300, initialX: m = 50, initialY: g = 50, inactive: v, minimized: y, maximized: b, modal: S = !1, onMinimize: C, onMaximize: T, onRestore: E, onClose: O, snapEnabled: k, snapThreshold: j = 20, autoMoveOnSnap: ee, style: M, className: te, zIndex: ne, windowId: re, ...N }) {
	let P = x(), F = P !== null, ue = P?.isMobile ?? !1, de = ee ?? P?.autoMoveOnSnap ?? !1, fe = o(), I = F ? re ?? fe : void 0, pe = k ?? !ue, me = l(null), he = l(null), [ge, _e] = u(y ?? !1), [L, ve] = u(b ?? !1), [ye, be] = u(ne ?? 1), xe = l(null), Se = l(null), [Ce, R] = u(!1), z = P?.register, B = P?.unregister, V = P?.updateGeometry, H = P?.moveRequests, we = P?.clearMoveRequest, Te = P?.resizeRequests, Ee = P?.clearResizeRequest, De = P?.getAllGeometries, Oe = P?.requestMove, ke = P?.requestResize, Ae = P?.setWindowSnapped, U = P?.restoreShrink, W = P?.preShrinkGeometries;
	a(() => {
		if (F && I && z && B) return z(I), () => {
			B(I);
		};
	}, [
		F,
		I,
		z,
		B
	]), a(() => {
		F && I && z && z(I, {
			title: e,
			icon: t
		});
	}, [
		F,
		I,
		z,
		e,
		t
	]);
	let je = F && I && P ? P.windows[I]?.zIndex ?? 1 : void 0, Me = F && I && P ? P.isActive(I) : void 0, G = (F && I && P ? P.windows[I]?.minimized : void 0) ?? ge, Ne = je === void 0 ? ye : je, Pe = Me === void 0 ? v : !Me, K = c(() => le(i, s, m, g), [
		i,
		s,
		m,
		g
	]), q = !L && pe, [J, Y] = u({
		x: K.x,
		y: K.y
	}), { size: X, setSize: Fe, getResizeHandleProps: Z } = A({
		initialWidth: K.width,
		initialHeight: K.height,
		initialX: K.x,
		initialY: K.y,
		position: J,
		onPositionChange: Y,
		minWidth: 200,
		minHeight: 100,
		clampToViewport: !0,
		reconcileOnResize: !0
	});
	a(() => {
		F && I && V && (L ? V(I, {
			x: 0,
			y: 0,
			width: window.innerWidth,
			height: window.innerHeight
		}) : V(I, {
			x: J.x,
			y: J.y,
			width: X.width,
			height: X.height
		}));
	}, [
		F,
		I,
		V,
		J.x,
		J.y,
		X.width,
		X.height,
		L
	]), a(() => {
		if (!F || !I || !H || !we) return;
		let e = H[I];
		if (!e) return;
		let t = window.innerWidth, n = window.innerHeight, r = Math.max(0, Math.min(e.x, t - X.width)), i = Math.max(0, Math.min(e.y, n - X.height)), a = window.requestAnimationFrame(() => {
			Y({
				x: r,
				y: i
			}), we(I);
		});
		return () => window.cancelAnimationFrame(a);
	}, [
		F,
		I,
		H,
		we,
		X.width,
		X.height
	]), a(() => {
		if (!F || !I || !Te || !Ee) return;
		let e = Te[I];
		if (!e) return;
		let t = window.requestAnimationFrame(() => {
			Y({
				x: e.x,
				y: e.y
			}), Fe({
				width: e.width,
				height: e.height
			}), Ee(I);
		});
		return () => window.cancelAnimationFrame(t);
	}, [
		F,
		I,
		Te,
		Ee,
		Fe
	]);
	let { dragHandleProps: Q, snapTarget: Ie } = D({
		initialX: K.x,
		initialY: K.y,
		position: J,
		onPositionChange: Y,
		snapEnabled: q,
		snapThreshold: q ? j : void 0,
		minWidth: q ? 200 : void 0,
		minHeight: q ? 100 : void 0,
		bounds: {
			width: X.width,
			height: X.height
		},
		onSnapCommit: q ? (e) => {
			if (xe.current = {
				x: J.x,
				y: J.y
			}, Se.current = {
				width: X.width,
				height: X.height
			}, Y({
				x: e.x,
				y: e.y
			}), Fe({
				width: e.width,
				height: e.height
			}), R(!0), I && Ae && Ae(I, !0), de && F && I && De && Oe) {
				let t = {
					x: e.x,
					y: e.y,
					width: e.width,
					height: e.height
				}, n = P?.windows[I]?.zIndex ?? Ne;
				Object.entries(De()).map(([e, t]) => ({
					id: e,
					backgroundRect: t,
					zIndex: P?.windows[e]?.zIndex ?? 0
				})).sort((e, t) => t.zIndex - e.zIndex).forEach(({ id: e, backgroundRect: r }) => {
					if (e === I || !ie(t, r) || (P?.windows[e]?.zIndex ?? 0) >= n) return;
					let i = W?.[e] ?? r, a = P?.windows[e]?.isSnapped ? ae(t, i, {
						minWidth: 200,
						minHeight: 100
					}) : null;
					if (a && ke) {
						let t = De()[e];
						t && t.x === a.x && t.y === a.y && t.width === a.width && t.height === a.height || ke(e, a);
					} else Oe(e, oe(t, r));
				});
			}
		} : void 0,
		onDragStart: () => {
			F || be((e) => e + 1), !Ce || !xe.current || !Se.current ? I && U && W?.[I] && U(I) : (Y(xe.current), Fe(Se.current), R(!1), I && Ae && Ae(I, !1), U && W && Object.keys(W).forEach((e) => {
				U(e);
			}));
		}
	}), Le = Ie && !G && !L ? {
		position: "fixed",
		top: Ie.y,
		left: Ie.x,
		width: Ie.width,
		height: Ie.height,
		zIndex: Ne + 1
	} : null, Re = () => {
		F && I && P ? (G ? P.restore(I) : P.minimize(I), C?.()) : (_e((e) => !e), C?.());
	}, ze = () => {
		ve(!0), F && I && P?.maximize(I), T?.();
	}, $ = () => {
		ve(!1), F && I && P?.restore(I), E?.();
	}, Be = () => {
		L ? $() : ze();
	}, Ve = G ? {
		position: "fixed",
		bottom: 4,
		left: 4,
		width: 220,
		height: "auto",
		...M
	} : L ? {
		position: "fixed",
		top: 0,
		left: 0,
		width: "100vw",
		height: "calc(100dvh - var(--win98-work-area-bottom, 0px))",
		...M
	} : {
		position: "fixed",
		top: J.y,
		left: J.x,
		width: X.width,
		height: X.height,
		...M
	}, He = (e) => {
		N.onPointerDown?.(e), F && I && P && P.focus(I);
	}, Ue = (e) => {
		N.onKeyDown?.(e), S && e.key === "Escape" && O?.();
	};
	a(() => {
		S && he.current?.focus();
	}, [S]);
	let We = /* @__PURE__ */ p("div", {
		...N,
		ref: he,
		className: _("window", se.window, te),
		style: {
			...Ve,
			display: "flex",
			flexDirection: "column",
			zIndex: Ne
		},
		onPointerDown: He,
		onKeyDown: Ue,
		role: N.role ?? (S ? "dialog" : void 0),
		"aria-modal": N["aria-modal"] ?? (S || void 0),
		"aria-label": N["aria-label"] ?? (S ? e : void 0),
		tabIndex: N.tabIndex ?? (S ? -1 : void 0),
		children: [
			S && /* @__PURE__ */ f("div", {
				"data-window-modal-backdrop": "",
				"aria-hidden": "true",
				style: {
					position: "fixed",
					inset: 0,
					zIndex: -1
				}
			}),
			/* @__PURE__ */ f(w, {
				ref: me,
				title: e,
				icon: t,
				inactive: Pe,
				isMaximized: L,
				isMinimized: G,
				onMinimize: Re,
				onMaximize: ze,
				onRestore: $,
				onClose: O,
				onDoubleClick: Be,
				...G ? {} : Q
			}),
			!G && /* @__PURE__ */ p(d, { children: [
				/* @__PURE__ */ f("div", {
					className: "window-body",
					style: {
						flex: 1,
						overflow: "hidden",
						margin: 0,
						padding: "2px",
						display: "flex",
						flexDirection: "column"
					},
					children: n
				}),
				r,
				r && !L && (() => {
					let { style: e, onPointerDown: t } = Z("se");
					return /* @__PURE__ */ f("div", {
						className: se.sizeGrip,
						style: e,
						onPointerDown: (e) => {
							I && U && W?.[I] && h(() => {
								U(I);
							}), t(e);
						}
					});
				})()
			] }),
			!L && !G && ce.map((e) => {
				let { style: t, onPointerDown: n } = Z(e);
				return /* @__PURE__ */ f("div", {
					className: _(se.resizeHandle, se[e]),
					style: t,
					onPointerDown: (e) => {
						I && U && W?.[I] && h(() => {
							U(I);
						}), n(e);
					}
				}, e);
			})
		]
	});
	return F && G ? null : /* @__PURE__ */ p(d, { children: [We, Le && /* @__PURE__ */ f("div", {
		"aria-hidden": "true",
		className: se.snapPreview,
		style: Le
	})] });
}
//#endregion
//#region src/components/window/StatusBar.tsx
var F = n(function({ children: e, className: t, ...n }, r) {
	return /* @__PURE__ */ f("div", {
		ref: r,
		className: _("status-bar", t),
		...n,
		children: e
	});
}), ue = n(function({ children: e, className: t, ...n }, r) {
	return /* @__PURE__ */ f("p", {
		ref: r,
		className: _("status-bar-field", t),
		...n,
		children: e
	});
}), de = n(({ variant: e = "standard", className: t, ...n }, r) => /* @__PURE__ */ f("button", {
	ref: r,
	className: _(t, { default: e === "default" }),
	...n
}));
de.displayName = "Button";
//#endregion
//#region src/components/Checkbox/Checkbox.tsx
var fe = n(({ id: e, label: t, stacked: n = !1, ...r }, i) => {
	let a = o(), s = e ?? (t == null ? void 0 : a);
	return /* @__PURE__ */ p(v, {
		stacked: n,
		children: [/* @__PURE__ */ f("input", {
			ref: i,
			type: "checkbox",
			id: s,
			...r
		}), t != null && /* @__PURE__ */ f("label", {
			htmlFor: s,
			children: t
		})]
	});
});
fe.displayName = "Checkbox";
//#endregion
//#region src/components/OptionButton/OptionButton.tsx
var I = n(({ id: e, name: t, label: n, stacked: r = !1, ...i }, a) => {
	let s = o(), c = e ?? (n == null ? void 0 : s);
	return /* @__PURE__ */ p(v, {
		stacked: r,
		children: [/* @__PURE__ */ f("input", {
			ref: a,
			type: "radio",
			id: c,
			name: t,
			...i
		}), n != null && /* @__PURE__ */ f("label", {
			htmlFor: c,
			children: n
		})]
	});
});
I.displayName = "OptionButton";
//#endregion
//#region src/components/GroupBox/GroupBox.tsx
var pe = n(({ legend: e, children: t, ...n }, r) => /* @__PURE__ */ p("fieldset", {
	ref: r,
	...n,
	children: [e == null ? null : /* @__PURE__ */ f("legend", { children: e }), t]
}));
pe.displayName = "GroupBox";
//#endregion
//#region src/components/TextBox/TextBox.tsx
var me = n(({ id: e, label: t, stacked: n = !1, ...r }, i) => {
	let a = o(), s = e ?? (t == null ? void 0 : a);
	return /* @__PURE__ */ p(v, {
		stacked: n,
		children: [t != null && /* @__PURE__ */ f("label", {
			htmlFor: s,
			children: t
		}), /* @__PURE__ */ f("input", {
			ref: i,
			type: "text",
			id: s,
			...r
		})]
	});
});
me.displayName = "TextBox";
//#endregion
//#region src/components/TextArea/TextArea.tsx
var he = n(({ id: e, label: t, stacked: n = !0, ...r }, i) => {
	let a = o(), s = e ?? (t == null ? void 0 : a);
	return /* @__PURE__ */ p(v, {
		stacked: n,
		children: [t != null && /* @__PURE__ */ f("label", {
			htmlFor: s,
			children: t
		}), /* @__PURE__ */ f("textarea", {
			ref: i,
			id: s,
			...r
		})]
	});
});
he.displayName = "TextArea";
//#endregion
//#region src/components/Slider/Slider.tsx
var ge = n(({ boxIndicator: e = !1, vertical: t = !1, className: n, ...r }, i) => {
	let a = /* @__PURE__ */ f("input", {
		ref: i,
		type: "range",
		className: _(n, { "has-box-indicator": e }),
		...r
	});
	return t ? /* @__PURE__ */ f("div", {
		className: "is-vertical",
		children: a
	}) : a;
});
ge.displayName = "Slider";
//#endregion
//#region src/components/Dropdown/Dropdown.tsx
var _e = n(({ options: e, children: t, ...n }, r) => /* @__PURE__ */ f("select", {
	ref: r,
	...n,
	children: t ?? e?.map((e) => /* @__PURE__ */ f("option", {
		value: e.value,
		children: e.label
	}, e.value))
}));
_e.displayName = "Dropdown";
var L = {
	menuBar: "_menuBar_1oy0y_3",
	grip: "_grip_1oy0y_37",
	menuBarItem: "_menuBarItem_1oy0y_69",
	menuBarItemActive: "_menuBarItemActive_1oy0y_107",
	menu: "_menu_1oy0y_3",
	menuItem: "_menuItem_1oy0y_149",
	menuItemDisabled: "_menuItemDisabled_1oy0y_183",
	menuItemFocused: "_menuItemFocused_1oy0y_193",
	menuSeparator: "_menuSeparator_1oy0y_215",
	rightAreaSeparator: "_rightAreaSeparator_1oy0y_231",
	rightArea: "_rightArea_1oy0y_231",
	rightIcon: "_rightIcon_1oy0y_269",
	menuItemCheck: "_menuItemCheck_1oy0y_281",
	menuItemArrow: "_menuItemArrow_1oy0y_295",
	submenu: "_submenu_1oy0y_309"
}, ve = {
	horizontal: "_horizontal_vog1e_5",
	vertical: "_vertical_vog1e_19"
};
//#endregion
//#region src/components/groove/Groove.tsx
function ye({ orientation: e = "horizontal", className: t, ...n }) {
	return /* @__PURE__ */ f("div", {
		role: "separator",
		"aria-orientation": e,
		"aria-hidden": "true",
		className: _(e === "vertical" ? ve.vertical : ve.horizontal, t),
		...n
	});
}
//#endregion
//#region src/components/menu-bar/MenuBar.tsx
function be(e) {
	return e.reduce((e, t, n) => (t.type !== "separator" && e.push(n), e), []);
}
function xe(e) {
	let t = e.match(/^(.*)\(([A-Za-z])\)(.*)$/);
	return t ? t[2] : null;
}
function Se(e) {
	let t = e.match(/^(.*)\(([A-Za-z])\)(.*)$/);
	if (!t) return e;
	let [, n, r, i] = t;
	return /* @__PURE__ */ p(d, { children: [
		n,
		"(",
		/* @__PURE__ */ f("u", {
			style: { textDecorationStyle: "solid" },
			children: r
		}),
		")",
		i
	] });
}
function Ce({ menus: e, rightIcons: t, className: n, ...i }) {
	let [o, c] = u(null), [h, g] = u(null), [v, y] = u(null), b = l(null), x = l(null), S = l(null), C = l([]), w = r(() => {
		let e = S.current, t = o === null ? null : C.current[o];
		if (!e || !t) return;
		let n = t.getBoundingClientRect();
		e.style.top = `${n.bottom}px`, e.style.left = `${n.left}px`;
	}, [o]);
	s(() => {
		if (w(), o === null) return;
		let e = () => w();
		return window.addEventListener("resize", e), window.addEventListener("scroll", e, !0), () => {
			window.removeEventListener("resize", e), window.removeEventListener("scroll", e, !0);
		};
	}, [o, w]);
	let T = r(() => {
		c(null), g(null), y(null);
	}, []), E = r((e) => {
		c(e), g(null), y(null);
	}, []);
	a(() => {
		if (o === null) return;
		let e = (e) => {
			let t = e.target;
			S.current?.contains(t) || x.current && !x.current.contains(t) && T();
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [o, T]);
	let D = (e) => {
		o === e ? T() : E(e);
	}, O = (e) => {
		o !== null && o !== e && E(e);
	}, k = r((e, t) => {
		t.stopPropagation(), e.type === "item" && !e.disabled && (e.onClick?.(), T());
	}, [T]), A = (e) => {
		b.current && clearTimeout(b.current), b.current = setTimeout(() => {
			y(e);
		}, 150);
	}, j = () => {
		b.current && clearTimeout(b.current);
	}, ee = (t) => {
		if (t.key === "Alt") {
			t.preventDefault(), x.current?.focus();
			return;
		}
		if (t.altKey && /^[a-zA-Z]$/.test(t.key)) {
			t.preventDefault();
			let n = t.key.toLowerCase(), r = e.findIndex((e) => {
				let t = xe(e.label);
				return t !== null && t.toLowerCase() === n;
			});
			if (r === -1) return;
			c(r), y(null), g(be(e[r].items)[0] ?? null);
			return;
		}
		if (o === null) return;
		let n = e[o], r = be(n.items);
		switch (t.key) {
			case "ArrowDown":
				if (t.preventDefault(), h === null) g(r[0] ?? null);
				else {
					let e = r.indexOf(h);
					g(r[(e + 1) % r.length] ?? null);
				}
				break;
			case "ArrowUp":
				if (t.preventDefault(), h === null) g(r[r.length - 1] ?? null);
				else {
					let e = r.indexOf(h);
					g(r[(e - 1 + r.length) % r.length] ?? null);
				}
				break;
			case "ArrowRight":
				t.preventDefault(), h !== null && n.items[h]?.type === "submenu" ? y(h) : E((o + 1) % e.length);
				break;
			case "ArrowLeft":
				t.preventDefault(), v === null ? E((o - 1 + e.length) % e.length) : y(null);
				break;
			case "Enter":
			case " ":
				if (t.preventDefault(), h !== null) {
					let e = n.items[h];
					e.type === "item" && !e.disabled ? (e.onClick?.(), T()) : e.type === "submenu" && !e.disabled && y(h);
				}
				break;
			case "Escape": t.preventDefault(), T();
		}
	}, M = (e, t = !1) => e.map((e, n) => {
		if (e.type === "separator") return /* @__PURE__ */ f("div", {
			className: L.menuSeparator,
			role: "separator"
		}, n);
		if (e.type === "submenu") {
			let r = !t && h === n;
			return /* @__PURE__ */ p("div", {
				className: _(L.menuItem, {
					[L.menuItemDisabled]: e.disabled,
					[L.menuItemFocused]: r
				}),
				onMouseEnter: () => !t && !e.disabled && A(n),
				onMouseLeave: t ? void 0 : j,
				role: "menuitem",
				"aria-haspopup": "true",
				"aria-disabled": e.disabled,
				children: [
					e.label,
					/* @__PURE__ */ f("span", {
						className: L.menuItemArrow,
						children: "▶"
					}),
					!t && v === n && /* @__PURE__ */ f("div", {
						className: L.submenu,
						role: "menu",
						children: M(e.items, !0)
					})
				]
			}, n);
		}
		let r = !t && h === n;
		return /* @__PURE__ */ p("div", {
			className: _(L.menuItem, {
				[L.menuItemDisabled]: e.disabled,
				[L.menuItemFocused]: r
			}),
			onClick: (t) => k(e, t),
			role: "menuitem",
			"aria-disabled": e.disabled,
			children: [
				e.checked && /* @__PURE__ */ f("span", {
					className: L.menuItemCheck,
					children: "✓"
				}),
				e.label,
				e.shortcut && /* @__PURE__ */ f("span", {
					className: L.menuItemArrow,
					children: e.shortcut
				})
			]
		}, n);
	});
	return /* @__PURE__ */ p("div", {
		ref: x,
		role: "menubar",
		className: _(L.menuBar, n),
		onKeyDown: ee,
		tabIndex: 0,
		...i,
		children: [
			/* @__PURE__ */ f("div", {
				className: L.grip,
				"aria-hidden": "true"
			}),
			e.map((e, t) => /* @__PURE__ */ f("div", {
				ref: (e) => {
					C.current[t] = e;
				},
				"data-menu-id": e.id ?? e.label,
				className: _(L.menuBarItem, { [L.menuBarItemActive]: o === t }),
				onClick: () => D(t),
				onMouseEnter: () => O(t),
				role: "menuitem",
				"aria-haspopup": "true",
				"aria-expanded": o === t,
				children: Se(e.label)
			}, t)),
			t && t.length > 0 && /* @__PURE__ */ p(d, { children: [/* @__PURE__ */ f(ye, {
				orientation: "vertical",
				className: L.rightAreaSeparator
			}), /* @__PURE__ */ f("div", {
				className: L.rightArea,
				children: t.map((e, t) => /* @__PURE__ */ f("img", {
					src: e,
					className: L.rightIcon,
					alt: "",
					"aria-hidden": "true"
				}, t))
			})] }),
			o !== null && m(/* @__PURE__ */ f("div", {
				ref: S,
				className: L.menu,
				role: "menu",
				style: {
					position: "fixed",
					top: 0,
					left: 0,
					zIndex: 1e4
				},
				children: M(e[o].items)
			}), document.body)
		]
	});
}
Ce.displayName = "MenuBar";
var R = {
	panel: "_panel_wlil7_1",
	item: "_item_wlil7_21",
	itemDisabled: "_itemDisabled_wlil7_47",
	itemActive: "_itemActive_wlil7_49",
	check: "_check_wlil7_71",
	label: "_label_wlil7_83",
	arrow: "_arrow_wlil7_91",
	separator: "_separator_wlil7_103",
	submenu: "_submenu_wlil7_119"
};
//#endregion
//#region src/components/menu/Menu.tsx
function z({ item: e, onClose: t }) {
	let [n, r] = u(!1), i = l(null);
	if (e.type === "separator") return /* @__PURE__ */ f("div", {
		className: R.separator,
		role: "separator"
	});
	let a = e.children && e.children.length > 0, o = e.disabled, s = () => {
		o || a || (e.onClick?.(), t?.());
	}, c = () => {
		i.current && clearTimeout(i.current), a && r(!0);
	}, d = () => {
		a && (i.current = setTimeout(() => r(!1), 150));
	}, m = () => {
		i.current && clearTimeout(i.current);
	};
	return /* @__PURE__ */ p("div", {
		className: _(R.item, {
			[R.itemDisabled]: o,
			[R.itemActive]: n
		}),
		role: "menuitem",
		"aria-disabled": o,
		"aria-haspopup": a ? "menu" : void 0,
		"aria-expanded": a ? n : void 0,
		onClick: s,
		onMouseEnter: c,
		onMouseLeave: d,
		children: [
			e.checked !== void 0 && /* @__PURE__ */ f("span", {
				className: R.check,
				children: e.checked ? "✓" : ""
			}),
			/* @__PURE__ */ f("span", {
				className: R.label,
				children: e.label
			}),
			a && /* @__PURE__ */ f("span", {
				className: R.arrow,
				children: "▶"
			}),
			a && n && /* @__PURE__ */ f("div", {
				className: R.submenu,
				role: "menu",
				onMouseEnter: m,
				onMouseLeave: d,
				children: e.children.map((e, n) => /* @__PURE__ */ f(z, {
					item: e,
					onClose: t
				}, n))
			})
		]
	});
}
function B({ items: e, onClose: t, className: n, ...r }) {
	return /* @__PURE__ */ f("div", {
		className: _(R.panel, n),
		role: "menu",
		...r,
		children: e.map((e, n) => /* @__PURE__ */ f(z, {
			item: e,
			onClose: t
		}, n))
	});
}
B.displayName = "Menu";
var V = {
	toolbar: "_toolbar_1x5ox_1",
	band: "_band_1x5ox_25",
	bandContainer: "_bandContainer_1x5ox_39",
	bandRowGroove: "_bandRowGroove_1x5ox_79",
	bandRow: "_bandRow_1x5ox_79",
	grip: "_grip_1x5ox_115",
	toolbarButton: "_toolbarButton_1x5ox_141",
	splitButtonGroup: "_splitButtonGroup_1x5ox_187",
	toolbarButtonCaret: "_toolbarButtonCaret_1x5ox_203",
	toolbarButtonPressed: "_toolbarButtonPressed_1x5ox_223",
	separator: "_separator_1x5ox_245",
	tooltip: "_tooltip_1x5ox_269",
	dropdownItem: "_dropdownItem_1x5ox_299",
	dropdownPanel: "_dropdownPanel_1x5ox_333",
	dropdownCaret: "_dropdownCaret_1x5ox_359"
}, H = {
	splitButtonGroup: "_splitButtonGroup_11zhe_3",
	button: "_button_11zhe_17",
	buttonPressed: "_buttonPressed_11zhe_75",
	caretButton: "_caretButton_11zhe_95",
	caret: "_caret_11zhe_95",
	menuWrapper: "_menuWrapper_11zhe_119"
};
//#endregion
//#region src/components/split-button/SplitButton.tsx
function we({ icon: e, label: t, tooltip: n, disabled: r, items: i, className: o }) {
	let [s, c] = u(!1), d = l(null);
	a(() => {
		if (!s) return;
		let e = (e) => {
			d.current && !d.current.contains(e.target) && c(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [s]);
	let m = n ?? t;
	return /* @__PURE__ */ p("div", {
		ref: d,
		className: _(H.splitButtonGroup, o),
		children: [
			/* @__PURE__ */ f("span", {
				className: H.button,
				"aria-hidden": "true",
				style: { pointerEvents: "none" },
				children: /* @__PURE__ */ f("img", {
					src: e,
					width: 16,
					height: 16,
					alt: ""
				})
			}),
			/* @__PURE__ */ f("button", {
				className: _(H.button, H.caretButton, { [H.buttonPressed]: s }),
				disabled: r,
				onClick: () => c((e) => !e),
				onKeyDown: (e) => {
					e.key === "Escape" && c(!1);
				},
				"aria-label": m ? `${m} メニューを開く` : "メニューを開く",
				"aria-haspopup": "true",
				"aria-expanded": s,
				title: m,
				children: /* @__PURE__ */ f("span", {
					className: H.caret,
					children: "▼"
				})
			}),
			s && /* @__PURE__ */ f("div", {
				className: H.menuWrapper,
				children: /* @__PURE__ */ f(B, {
					items: i,
					onClose: () => c(!1)
				})
			})
		]
	});
}
we.displayName = "SplitButton";
//#endregion
//#region src/components/toolbar/Toolbar.tsx
var Te = n(function({ items: e, variant: t = "plain", className: n, ...i }, o) {
	let [s, c] = u(null), [d, m] = u(null), h = l(null), g = l(null), v = () => {
		h.current && clearTimeout(h.current);
	}, y = (e, t) => {
		v(), t && (h.current = setTimeout(() => c(e), 500));
	}, b = () => {
		v(), c(null);
	};
	a(() => {
		if (!d) return;
		let e = (e) => {
			g.current && !g.current.contains(e.target) && m(null);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [d]);
	let x = r((e) => {
		g.current = e, typeof o == "function" ? o(e) : o && (o.current = e);
	}, [o]);
	return /* @__PURE__ */ p("div", {
		ref: x,
		role: "toolbar",
		className: _(V.toolbar, t === "band" && V.band, n),
		...i,
		children: [/* @__PURE__ */ f("div", {
			className: V.grip,
			"aria-hidden": "true"
		}), e.map((e, t) => {
			if (e.type === "separator") return /* @__PURE__ */ f("div", {
				className: V.separator,
				role: "separator"
			}, t);
			if (e.type === "button") return /* @__PURE__ */ p("button", {
				className: _(V.toolbarButton, { [V.toolbarButtonPressed]: e.pressed }),
				disabled: e.disabled,
				onClick: e.onClick,
				onMouseEnter: () => y(e.id, e.tooltip ?? e.label),
				onMouseLeave: b,
				"aria-label": e.tooltip ?? e.label,
				"aria-pressed": e.pressed,
				title: e.tooltip ?? e.label,
				children: [e.icon && /* @__PURE__ */ f("img", {
					src: e.icon,
					width: 16,
					height: 16,
					alt: ""
				}), s === e.id && (e.tooltip ?? e.label) && /* @__PURE__ */ f("span", {
					className: V.tooltip,
					role: "tooltip",
					children: e.tooltip ?? e.label
				})]
			}, e.id);
			if (e.type === "dropdown") {
				let t = d === e.id, n = !e.icon;
				return /* @__PURE__ */ p("div", {
					style: {
						position: "relative",
						flexShrink: 0
					},
					children: [/* @__PURE__ */ p("button", {
						className: _(V.toolbarButton, {
							[V.toolbarButtonPressed]: t,
							[V.toolbarButtonCaret]: n
						}),
						disabled: e.disabled,
						onClick: () => m(t ? null : e.id),
						onMouseEnter: () => y(e.id, e.tooltip ?? e.label),
						onMouseLeave: b,
						"aria-label": e.tooltip ?? e.label,
						"aria-haspopup": "true",
						"aria-expanded": t,
						title: e.tooltip ?? e.label,
						children: [
							e.icon && /* @__PURE__ */ f("img", {
								src: e.icon,
								width: 16,
								height: 16,
								alt: ""
							}),
							/* @__PURE__ */ f("span", {
								className: V.dropdownCaret,
								children: "▼"
							}),
							s === e.id && (e.tooltip ?? e.label) && /* @__PURE__ */ f("span", {
								className: V.tooltip,
								role: "tooltip",
								children: e.tooltip ?? e.label
							})
						]
					}), t && /* @__PURE__ */ f("div", {
						style: {
							position: "absolute",
							top: "100%",
							left: 0,
							zIndex: 9999
						},
						children: /* @__PURE__ */ f(B, {
							items: e.items,
							onClose: () => m(null)
						})
					})]
				}, e.id);
			}
			return e.type === "splitButton" ? /* @__PURE__ */ f(we, {
				icon: e.icon,
				label: e.label,
				tooltip: e.tooltip,
				disabled: e.disabled,
				items: e.items
			}, e.id) : null;
		})]
	});
});
Te.displayName = "Toolbar";
//#endregion
//#region src/components/toolbar/ToolbarBand.tsx
var Ee = n(function({ rows: t, className: n, ...r }, i) {
	return /* @__PURE__ */ f("div", {
		ref: i,
		className: _(V.bandContainer, n),
		...r,
		children: t.map((t, n) => /* @__PURE__ */ p(e, { children: [n > 0 && /* @__PURE__ */ f(ye, { className: V.bandRowGroove }), t] }, n))
	});
});
Ee.displayName = "ToolbarBand";
//#endregion
//#region src/components/toolbar/ToolbarRow.tsx
function De({ children: e, className: t, ...n }) {
	return /* @__PURE__ */ f("div", {
		className: _(V.bandRow, t),
		...n,
		children: e
	});
}
//#endregion
//#region src/components/toolbar/useToolbarRows.ts
function Oe(e, t, { gap: n = 1, keepWithNext: r = [] } = {}) {
	let i = [], a = [], o = 0;
	return e.forEach((s, c) => {
		let l = e[c + 1], u = r[c] === !0 && l !== void 0 && o + n + s + n + l > t;
		a.length > 0 && (o + n + s > t || u) ? (i.push(a), a = [c], o = s) : (o = a.length === 0 ? s : o + n + s, a.push(c));
	}), a.length > 0 && i.push(a), i;
}
function ke(e) {
	return e.getBoundingClientRect().width;
}
function Ae(e, t) {
	return e === t ? !0 : e === null || t === null ? !1 : e.length === t.length && e.every((e, n) => e.length === t[n].length && e.every((e, r) => e === t[n][r]));
}
function U({ count: e, gap: t = 1, paddingX: n = 0, keepWithNext: i, measure: o }) {
	let s = l(null), c = l([]), [d, f] = u(null), p = i?.join(",") ?? "", m = l({
		gap: t,
		paddingX: n,
		keepWithNext: i,
		measure: o
	});
	return a(() => {
		m.current = {
			gap: t,
			paddingX: n,
			keepWithNext: i,
			measure: o
		};
	}, [
		t,
		n,
		p,
		i
	]), a(() => {
		let t = () => {
			let t = s.current;
			if (!t) return;
			let { gap: n, paddingX: r, keepWithNext: i, measure: a = ke } = m.current, o = t.getBoundingClientRect().width - r * 2, l = c.current.slice(0, e).map((e, t) => e ? a(e, t) : 0), u = o > 0 && l.length > 0 && l.every((e) => e > 0) ? Oe(l, o, {
				gap: n,
				keepWithNext: i
			}) : null;
			f((t) => u === null ? t === null ? t : null : t !== null && t.count === e && Ae(t.rows, u) ? t : {
				count: e,
				rows: u
			});
		};
		if (t(), typeof ResizeObserver > "u") return;
		let n = new ResizeObserver(t), r = s.current;
		r && n.observe(r);
		for (let t of c.current.slice(0, e)) t && n.observe(t);
		return () => n.disconnect();
	}, [
		e,
		t,
		n,
		p,
		d
	]), {
		stripRef: r((e) => {
			s.current = e;
		}, []),
		itemRefs: c,
		rows: d !== null && d.count === e ? d.rows : e === 0 ? [] : [Array.from({ length: e }, (e, t) => t)]
	};
}
var W = {
	addressBar: "_addressBar_k423c_1",
	grip: "_grip_k423c_25",
	label: "_label_k423c_51",
	select: "_select_k423c_69"
};
//#endregion
//#region src/components/address-bar/AddressBar.tsx
function je({ value: e, onChange: t, onNavigate: n, history: r = [], label: i = "アドレス(D):", className: a, ...o }) {
	let s = (e) => {
		let r = e.target.value;
		t?.(r), n?.(r);
	}, c = [{
		path: e,
		label: e
	}, ...r.filter((t) => t.path !== e)];
	return /* @__PURE__ */ p("div", {
		className: _(W.addressBar, a),
		...o,
		children: [
			/* @__PURE__ */ f("div", {
				className: W.grip,
				"aria-hidden": "true"
			}),
			/* @__PURE__ */ f("span", {
				className: W.label,
				children: i
			}),
			/* @__PURE__ */ f("select", {
				className: W.select,
				value: e,
				onChange: s,
				"aria-label": i,
				children: c.map((e, t) => /* @__PURE__ */ f("option", {
					value: e.path,
					children: e.label ?? e.path
				}, t))
			})
		]
	});
}
je.displayName = "AddressBar";
var Me = { treeView: "_treeView_1f58e_3" }, G = (e, t, n) => {
	let r = {
		display: "flex",
		alignItems: "center",
		whiteSpace: "nowrap",
		...t === e.id ? {
			background: "#000080",
			color: "white"
		} : {}
	};
	return e.children?.length ? /* @__PURE__ */ f("li", { children: /* @__PURE__ */ p("details", {
		open: e.defaultOpen,
		children: [/* @__PURE__ */ f("summary", {
			style: r,
			children: e.label
		}), /* @__PURE__ */ f("ul", { children: e.children.map((e) => G(e, t, n)) })]
	}) }, e.id) : /* @__PURE__ */ f("li", {
		tabIndex: 0,
		onClick: () => {
			n?.(e.id);
		},
		onKeyDown: (t) => {
			(t.key === "Enter" || t.key === " ") && (t.preventDefault(), n?.(e.id));
		},
		children: /* @__PURE__ */ p("span", {
			style: r,
			children: [e.icon ? /* @__PURE__ */ f("img", {
				src: e.icon,
				width: 16,
				height: 16,
				alt: "",
				"aria-hidden": "true",
				style: {
					marginRight: 4,
					flexShrink: 0
				}
			}) : null, e.label]
		})
	}, e.id);
}, Ne = n(({ items: e, selectedId: t, onSelect: n, className: r, ...i }, a) => /* @__PURE__ */ f("ul", {
	ref: a,
	className: _("tree-view", Me.treeView, r),
	...i,
	children: e.map((e) => G(e, t, n))
}));
Ne.displayName = "TreeView";
var Pe = {
	fill: "_fill_150hs_9",
	panel: "_panel_150hs_23",
	body: "_body_150hs_37"
}, K = n(({ tabs: e, activeTab: t, defaultActiveTab: n, onTabChange: r, multirows: i = !1, fill: a = !1, panelClassName: o, className: s, ...l }, d) => {
	let m = c(() => e.find((e) => !e.disabled)?.id ?? e[0]?.id, [e]), [h, g] = u(n ?? m), v = t != null, y = t ?? h ?? m, b = e.find((e) => e.id === y) ?? e[0], x = (e, t) => {
		t || (v || g(e), r?.(e));
	}, S = (t) => {
		let n = e.filter((e) => !e.disabled);
		if (n.length === 0) return;
		let r = n.findIndex((e) => e.id === y), i = r === -1 ? 0 : r, a;
		switch (t.key) {
			case "ArrowRight":
				a = (i + 1) % n.length;
				break;
			case "ArrowLeft":
				a = (i - 1 + n.length) % n.length;
				break;
			case "Home":
				a = 0;
				break;
			case "End":
				a = n.length - 1;
				break;
			default: return;
		}
		t.preventDefault();
		let o = n[a];
		x(o.id);
	};
	return /* @__PURE__ */ p("div", {
		ref: d,
		className: _(a && Pe.fill, s),
		...l,
		children: [/* @__PURE__ */ f("menu", {
			role: "tablist",
			className: _({ multirows: i }),
			onKeyDown: S,
			children: e.map((e) => {
				let t = e.id === y;
				return /* @__PURE__ */ f("li", {
					role: "tab",
					"aria-selected": t,
					"aria-disabled": e.disabled || void 0,
					children: /* @__PURE__ */ f("a", {
						href: `#${e.id}`,
						onClick: (t) => {
							t.preventDefault(), x(e.id, e.disabled);
						},
						children: e.label
					})
				}, e.id);
			})
		}), /* @__PURE__ */ f("div", {
			className: _("window", Pe.panel, o),
			role: "tabpanel",
			children: /* @__PURE__ */ f("div", {
				className: _("window-body", Pe.body),
				children: b?.content
			})
		})]
	});
});
K.displayName = "Tabs";
var q = {
	headerButton: "_headerButton_w2e2b_1",
	headerText: "_headerText_w2e2b_53",
	sortIndicator: "_sortIndicator_w2e2b_61",
	headerCell: "_headerCell_w2e2b_69",
	resizeHandle: "_resizeHandle_w2e2b_81"
};
//#endregion
//#region src/components/table-view/TableView.tsx
function J({ columns: e, rows: t, selectedIds: n, onSelectionChange: i, onRowDoubleClick: a, onRowContextMenu: o, sort: s, onSortChange: d, interactive: m = !0, height: h = 200, className: g, style: v, ...y }, b) {
	let [x, S] = u([]), [C, w] = u(() => e.map((e) => e.width ?? 100)), T = n ?? x, E = c(() => new Set(T.map((e) => String(e))), [T]), D = n != null, O = d != null, k = (e) => {
		let t = e.map((e) => String(e));
		D || S(t), i?.(t);
	}, A = (e, t) => {
		let n = String(e.id);
		if (t.ctrlKey || t.metaKey) {
			let e = E.has(n) ? T.filter((e) => String(e) !== n) : [...T, n];
			k(e);
		} else k([n]);
	}, j = l(null), ee = r((e, t) => {
		t.preventDefault(), t.stopPropagation(), j.current = {
			colIndex: e,
			startX: t.clientX,
			startWidth: typeof C[e] == "number" ? C[e] : 100
		};
		let n = (e) => {
			if (!j.current) return;
			let t = e.clientX - j.current.startX, n = Math.max(30, j.current.startWidth + t);
			w((e) => {
				let t = [...e];
				return t[j.current.colIndex] = n, t;
			});
		}, r = () => {
			j.current = null, document.removeEventListener("mousemove", n), document.removeEventListener("mouseup", r);
		};
		document.addEventListener("mousemove", n), document.addEventListener("mouseup", r);
	}, [C]), M = r((e) => {
		d && d({
			columnKey: e,
			direction: s?.columnKey === e && s.direction === "asc" ? "desc" : "asc"
		});
	}, [d, s]);
	return /* @__PURE__ */ f("div", {
		ref: b,
		className: _("sunken-panel", g),
		style: {
			height: h,
			overflow: "auto",
			...v
		},
		...y,
		children: /* @__PURE__ */ p("table", {
			className: _({ interactive: m }),
			style: {
				tableLayout: "fixed",
				width: "100%"
			},
			children: [/* @__PURE__ */ f("thead", { children: /* @__PURE__ */ f("tr", { children: e.map((e, t) => {
				let n = s?.columnKey === e.key, r = n ? e.header + " sorted " + (s.direction === "asc" ? "ascending" : "descending") : e.header;
				return /* @__PURE__ */ p("th", {
					"aria-sort": n ? s.direction === "asc" ? "ascending" : "descending" : void 0,
					className: q.headerCell,
					style: {
						width: C[t],
						position: "relative",
						overflow: "hidden"
					},
					children: [O ? /* @__PURE__ */ f("button", {
						type: "button",
						className: q.headerButton,
						"aria-label": r,
						onClick: () => M(e.key),
						children: /* @__PURE__ */ f("span", {
							className: q.headerText,
							children: e.header
						})
					}) : e.header, /* @__PURE__ */ f("div", {
						className: q.resizeHandle,
						onMouseDown: (e) => ee(t, e)
					})]
				}, String(e.key));
			}) }) }), /* @__PURE__ */ f("tbody", { children: t.map((t) => {
				let n = E.has(String(t.id));
				return /* @__PURE__ */ f("tr", {
					className: _({ highlighted: n }),
					onClick: (e) => A(t, e),
					onDoubleClick: () => a?.(t),
					onContextMenu: (e) => {
						o && (e.preventDefault(), o(t, e));
					},
					children: e.map((e) => {
						let n = t[e.key];
						return /* @__PURE__ */ f("td", {
							style: {
								overflow: "hidden",
								whiteSpace: "nowrap"
							},
							children: e.render ? e.render(n, t) : String(n)
						}, String(e.key));
					})
				}, t.id);
			}) })]
		})
	});
}
var Y = n(J);
Y.displayName = "TableView";
var X = {
	taskbar: "_taskbar_1xh6s_1",
	start: "_start_1xh6s_29",
	taskButton: "_taskButton_1xh6s_111",
	taskButtonActive: "_taskButtonActive_1xh6s_163",
	taskButtonLabel: "_taskButtonLabel_1xh6s_179",
	tray: "_tray_1xh6s_199",
	clock: "_clock_1xh6s_227"
}, Fe = "https://cdn.jsdelivr.net/gh/grassmunk/Chicago95@master/Icons/Chicago95", Z = (e) => `${Fe}/${e}`, Q = {
	hardDrive: Z("devices/scalable/drive-harddisk.svg"),
	floppyDrive: Z("devices/scalable/drive-removable-media-floppy.svg"),
	cdDrive: Z("devices/scalable/media-optical.svg"),
	networkDrive: Z("devices/scalable/network-wired.svg"),
	removableDrive: Z("devices/scalable/media-flash.svg"),
	folderClosed: Z("places/scalable/folder-documents.svg"),
	folderOpen: Z("places/scalable/folder_open.svg"),
	folderWindows: Z("places/scalable/folder_home.svg"),
	folderSystem: Z("places/scalable/folder_images.svg"),
	myComputer: Z("devices/scalable/gnome-computer.svg"),
	myDocuments: Z("places/scalable/folder-documents.svg"),
	recycleBinEmpty: Z("places/scalable/emptytrash.svg"),
	recycleBinFull: Z("places/scalable/edittrash.svg"),
	desktop: Z("places/scalable/desktop.svg"),
	fileGeneric: Z("mimes/scalable/empty.svg"),
	fileText: Z("mimes/scalable/text-x-generic-template.svg"),
	fileExecutable: Z("mimes/scalable/application-x-executable.svg"),
	fileImage: Z("mimes/scalable/image-x-generic.svg"),
	fileHtml: Z("mimes/scalable/text-html.svg"),
	fileScript: Z("mimes/scalable/text-x-script.svg"),
	back: Z("actions/scalable/go-previous.svg"),
	forward: Z("actions/scalable/go-next.svg"),
	up: Z("actions/scalable/go-up.svg"),
	cut: Z("actions/scalable/edit-cut.svg"),
	copy: Z("actions/scalable/edit-copy.svg"),
	paste: Z("actions/scalable/edit-paste.svg"),
	delete: Z("actions/scalable/edit-delete.svg"),
	properties: Z("actions/scalable/document-properties.svg"),
	shellWindow: Z("apps/scalable/system-file-manager.svg"),
	windowsLogo: Z("places/scalable/start-here.svg"),
	windowsSlanted: Z("places/scalable/start-here.svg")
};
function Ie(e) {
	switch (e.split(".").pop()?.toLowerCase()) {
		case "exe":
		case "com": return Q.fileExecutable;
		case "txt":
		case "log": return Q.fileText;
		case "png":
		case "jpg":
		case "jpeg":
		case "gif":
		case "bmp": return Q.fileImage;
		case "html":
		case "htm": return Q.fileHtml;
		case "js":
		case "ts":
		case "vbs":
		case "bat": return Q.fileScript;
		default: return Q.fileGeneric;
	}
}
//#endregion
//#region src/icons/Icon.tsx
function Le({ name: e, size: t = 16, alt: n = "", className: r, style: i }) {
	return /* @__PURE__ */ f("img", {
		src: Q[e],
		width: t,
		height: t,
		alt: n,
		className: r,
		style: {
			imageRendering: "pixelated",
			...i
		},
		draggable: !1
	});
}
//#endregion
//#region src/components/taskbar/Taskbar.tsx
function Re(e) {
	return `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
}
function ze({ items: e, onItemClick: t, onStartClick: n, clock: r, showTray: i = !0, className: o, ...s }) {
	let [c, l] = u(() => Re(/* @__PURE__ */ new Date())), d = x();
	a(() => {
		if (r !== void 0) return;
		let e = setInterval(() => l(Re(/* @__PURE__ */ new Date())), 6e4);
		return () => clearInterval(e);
	}, [r]);
	let m = d ? Object.values(d.windows).map((e) => ({
		id: e.id,
		title: e.title ?? e.id,
		icon: e.icon,
		active: d.isActive(e.id),
		minimized: e.minimized
	})) : [], h = e ?? m, g = (e) => {
		if (t) {
			t(e);
			return;
		}
		if (!d) return;
		let n = d.windows[e];
		n && (n.minimized ? (d.restore(e), d.focus(e)) : d.isActive(e) ? d.minimize(e) : d.focus(e));
	}, v = r ?? c;
	return /* @__PURE__ */ p("div", {
		role: "toolbar",
		"aria-label": "タスクバー",
		className: _(X.taskbar, o),
		...s,
		children: [
			/* @__PURE__ */ p("button", {
				type: "button",
				className: X.start,
				"aria-label": "スタート",
				"data-taskbar-start": "",
				onClick: n,
				children: [/* @__PURE__ */ f(Le, {
					name: "windowsLogo",
					size: 16
				}), /* @__PURE__ */ f("span", { children: "スタート" })]
			}),
			h.map((e) => /* @__PURE__ */ p("button", {
				type: "button",
				className: _(X.taskButton, { [X.taskButtonActive]: e.active }),
				"aria-pressed": e.active,
				title: e.title,
				onClick: () => g(e.id),
				children: [e.icon && /* @__PURE__ */ f("img", {
					src: e.icon,
					width: 16,
					height: 16,
					alt: ""
				}), /* @__PURE__ */ f("span", {
					className: X.taskButtonLabel,
					children: e.title
				})]
			}, e.id)),
			i !== !1 && /* @__PURE__ */ f("div", {
				className: X.tray,
				"aria-label": "タスクトレイ",
				children: /* @__PURE__ */ f("span", {
					className: X.clock,
					children: v
				})
			})
		]
	});
}
var $ = {
	root: "_root_1komv_1",
	banner: "_banner_1komv_37",
	list: "_list_1komv_69",
	item: "_item_1komv_83",
	itemDisabled: "_itemDisabled_1komv_107",
	itemActive: "_itemActive_1komv_109",
	icon: "_icon_1komv_127",
	label: "_label_1komv_145",
	arrow: "_arrow_1komv_153",
	separator: "_separator_1komv_165",
	submenu: "_submenu_1komv_179"
}, Be = 150;
function Ve({ item: e, active: t = !1, forceOpen: n = !1, onClose: r, onHover: i }) {
	let [o, s] = u(!1), c = l(null);
	if (a(() => () => {
		clearTimeout(c.current ?? void 0);
	}, []), e.type === "separator") return /* @__PURE__ */ f("div", {
		className: $.separator,
		role: "separator"
	});
	let d = e.type === "submenu", m = e.type === "item" && !!e.disabled, h = d && (n || o), g = () => {
		m || (d ? s(!0) : (e.onClick?.(), r?.()));
	}, v = () => {
		i?.(), clearTimeout(c.current ?? void 0), d && (c.current = setTimeout(() => s(!0), Be));
	}, y = () => {
		c.current &&= (clearTimeout(c.current), null), d && s(!1);
	}, b = () => {
		clearTimeout(c.current ?? void 0);
	};
	return /* @__PURE__ */ p("div", {
		className: _($.item, {
			[$.itemDisabled]: m,
			[$.itemActive]: t || h
		}),
		role: "menuitem",
		"aria-disabled": m || void 0,
		"aria-haspopup": d ? "menu" : void 0,
		"aria-expanded": d ? h : void 0,
		"data-active": t ? "true" : void 0,
		onClick: g,
		onMouseEnter: v,
		onMouseLeave: y,
		children: [
			/* @__PURE__ */ f("span", {
				className: $.icon,
				children: e.icon ? /* @__PURE__ */ f(Le, {
					name: e.icon,
					size: 16
				}) : null
			}),
			/* @__PURE__ */ f("span", {
				className: $.label,
				children: e.label
			}),
			d && /* @__PURE__ */ f("span", {
				className: $.arrow,
				children: "▶"
			}),
			d && h && /* @__PURE__ */ f("div", {
				className: $.submenu,
				role: "menu",
				onMouseEnter: b,
				onMouseLeave: y,
				children: e.items.map((e, t) => /* @__PURE__ */ f(Ve, {
					item: e,
					onClose: r
				}, t))
			})
		]
	});
}
function He({ items: e, onClose: t, bannerText: n = "Windows 98", width: r = 200, ignoreOutsidePressSelector: i, className: o, style: s, ...c }) {
	let d = l(null), [m, h] = u(null), [g, v] = u(null);
	a(() => {
		d.current?.focus();
	}, []), a(() => {
		let e = (e) => {
			let n = e.target;
			i && n?.closest(i) || d.current && !d.current.contains(e.target) && t?.();
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, [t, i]);
	let y = e.map((e, t) => e.type === "separator" ? -1 : t).filter((e) => e >= 0), b = (n) => {
		let r = n.key;
		if (r === "Escape") {
			n.preventDefault(), t?.();
			return;
		}
		if (y.length === 0) return;
		let i = m === null ? -1 : y.indexOf(m), a = m === null ? void 0 : e[m];
		switch (r) {
			case "ArrowDown":
				n.preventDefault(), h(y[(i + 1) % y.length]), v(null);
				break;
			case "ArrowUp":
				n.preventDefault(), h(y[(i - 1 + y.length) % y.length]), v(null);
				break;
			case "ArrowRight":
				n.preventDefault(), a?.type === "submenu" && v(m);
				break;
			case "ArrowLeft":
				n.preventDefault(), v(null);
				break;
			case "Enter":
			case " ":
				if (n.preventDefault(), !a || a.type === "separator") break;
				if (a.type === "submenu") {
					v(m);
					break;
				}
				if (a.disabled) break;
				a.onClick?.(), t?.();
		}
	};
	return /* @__PURE__ */ p("div", {
		ref: d,
		role: "menu",
		"aria-label": "スタート メニュー",
		tabIndex: 0,
		className: _($.root, o),
		style: {
			width: r,
			...s
		},
		onKeyDown: b,
		...c,
		children: [/* @__PURE__ */ f("div", {
			className: $.banner,
			"aria-hidden": "true",
			children: n
		}), /* @__PURE__ */ f("div", {
			className: $.list,
			children: e.map((e, n) => /* @__PURE__ */ f(Ve, {
				item: e,
				active: m === n,
				forceOpen: g === n,
				onClose: t,
				onHover: () => h(n)
			}, n))
		})]
	});
}
He.displayName = "StartMenu";
var Ue = {
	root: "_root_18942_3",
	icon: "_icon_18942_21",
	dragging: "_dragging_18942_53",
	image: "_image_18942_63",
	label: "_label_18942_75"
}, We = 8, Ge = 75;
function Ke({ items: e, selectedId: t = null, onSelect: n, onOpen: r, onMove: i, gridSize: a = Ge, className: o, onClick: s, onPointerMove: c, onPointerUp: d, onPointerCancel: m, ...h }) {
	let [g, v] = u(null), y = l(null), b = l(!1), x = (e, t) => {
		if (e.button === 0) {
			b.current = !1;
			try {
				e.currentTarget.setPointerCapture?.(e.pointerId);
			} catch {}
			y.current = {
				id: t.id,
				pointerId: e.pointerId,
				startClientX: e.clientX,
				startClientY: e.clientY,
				originX: t.x,
				originY: t.y,
				moved: !1
			};
		}
	};
	return /* @__PURE__ */ f("div", {
		role: "listbox",
		"aria-label": "デスクトップ",
		className: _(Ue.root, o),
		onClick: (e) => {
			s?.(e), e.target === e.currentTarget && n?.(null);
		},
		onPointerMove: (e) => {
			c?.(e);
			let t = y.current;
			if (!t || e.pointerId !== t.pointerId) return;
			let n = e.clientX - t.startClientX, r = e.clientY - t.startClientY;
			!t.moved && Math.hypot(n, r) < We || (t.moved = !0, v({
				id: t.id,
				x: Math.max(0, t.originX + n),
				y: Math.max(0, t.originY + r)
			}));
		},
		onPointerUp: (e) => {
			d?.(e);
			let t = y.current;
			if (!t || e.pointerId !== t.pointerId) return;
			if (y.current = null, !t.moved) {
				v(null);
				return;
			}
			let n = Math.max(0, Math.round((t.originX + (e.clientX - t.startClientX)) / a) * a), r = Math.max(0, Math.round((t.originY + (e.clientY - t.startClientY)) / a) * a);
			v(null), b.current = !0, i?.(t.id, {
				x: n,
				y: r
			});
		},
		onPointerCancel: (e) => {
			m?.(e), y.current && (y.current = null, v(null));
		},
		...h,
		children: e.map((e) => {
			let i = e.id === t, o = g?.id === e.id, s = o && g ? g : e;
			return /* @__PURE__ */ p("div", {
				role: "option",
				tabIndex: 0,
				"aria-selected": i,
				"data-selected": i ? "true" : void 0,
				className: _(Ue.icon, o && Ue.dragging),
				style: {
					left: s.x,
					top: s.y,
					width: a
				},
				onPointerDown: (t) => x(t, e),
				onClick: () => {
					b.current || n?.(e.id);
				},
				onDoubleClick: () => {
					b.current || r?.(e.id);
				},
				onKeyDown: (t) => {
					t.key === "Enter" ? (t.preventDefault(), r?.(e.id)) : t.key === " " && (t.preventDefault(), n?.(e.id));
				},
				children: [/* @__PURE__ */ f("img", {
					className: Ue.image,
					src: e.icon,
					width: 32,
					height: 32,
					alt: "",
					draggable: !1
				}), /* @__PURE__ */ f("span", {
					className: Ue.label,
					children: e.label
				})]
			}, e.id);
		})
	});
}
Ke.displayName = "DesktopIcons";
//#endregion
export { je as AddressBar, de as Button, fe as Checkbox, Ke as DesktopIcons, _e as Dropdown, v as FieldRow, ye as Groove, pe as GroupBox, Q as ICONS, Le as Icon, B as Menu, Ce as MenuBar, I as OptionButton, ge as Slider, we as SplitButton, He as StartMenu, F as StatusBar, ue as StatusBarField, Y as TableView, K as Tabs, ze as Taskbar, he as TextArea, me as TextBox, w as TitleBar, Te as Toolbar, Ee as ToolbarBand, De as ToolbarRow, Ne as TreeView, S as Win98Provider, P as Window, b as WindowManagerContext, Ie as getFileIcon, Oe as packToolbarRows, U as useToolbarRows, y as useWindowManager, x as useWindowManagerContext };
