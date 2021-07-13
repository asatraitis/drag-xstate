import { assign, createMachine, interpret, spawn, actions } from "xstate";
const { stop } = actions;
const calcDistance = (x, y) => {
	return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
};

const draggingSvc = (callback, onRec) => {
	const handleDragging = (event) => {
		callback(event);
	};
	window.addEventListener("mousemove", handleDragging);
	return () => {
		window.removeEventListener("mousemove", handleDragging);
	};
};

const droppingSvc = (callback, onRec) => {
	const handleDrop = (e) => {
		callback(e);
	};
	window.addEventListener("mouseup", handleDrop);
	return () => {
		window.removeEventListener("mouseup", handleDrop);
	};
};

export const dragMachine = createMachine(
	{
		id: "drag-machine",
		initial: "idle",
		context: {
			draggingRef: null,
			dropRef: null,
			ref: null,
			refData: null,
			threshold: 20,
			left: 0,
			top: 0,
			pointerx: 0,
			pointery: 0,
			dx: 0,
			dy: 0,
		},
		on: {
			SET_REF_DATA: {
				actions: "setRefData",
			},
		},
		states: {
			idle: {
				on: {
					mousedown: {
						target: "initMouseDrag",
						actions: ["setPointer", "setRef", "setRefPos", "setRefData"],
					},
				},
			},
			initMouseDrag: {
				invoke: [
					{
						id: "mouse-drag-init",
						src: "mouseDragInit",
					},
					{
						id: "mouse-release",
						src: "mouseRelease",
					},
				],
				on: {
					MOUSE_UP: "idle",
					START_DRAGGING: {
						cond: "isOutsideThreshold",
						target: "dragging",
						actions: "spawnDraggingSvcs",
					},
				},
			},
			initTouchDrag: {},
			dragging: {
				on: {
					mousemove: {
						actions: "moveDraggable",
					},
					mouseup: {
						target: "idle",
						actions: ["resetDraggable", "stopDraggingSvc", "stopDroppingSvc"],
					},
					ENTER_DROP_AREA: "inDropArea",
				},
			},
			inDropArea: {
				on: {
					mousemove: {
						actions: "moveDraggable",
					},
					mouseup: {
						target: "idle",
						actions: ["resetDraggable", "stopDraggingSvc", "stopDroppingSvc"],
					},
					LEAVE_DROP_AREA: "dragging",
				},
			},
		},
	},
	{
		guards: {
			isOutsideThreshold: (ctx, { x, y }) =>
				calcDistance(x, y) >= ctx.threshold,
		},
		actions: {
			setChildren: assign((ctx, e) => ({ ...ctx, children: e.children })),
			setRef: assign((ctx, e) => ({ ...ctx, ref: e.ref })),
			setRefData: assign((ctx, e) => ({ ...ctx, refData: e.data })),
			setPointer: assign((ctx, e) => ({
				...ctx,
				pointerx: e.clientX,
				pointery: e.clientY,
			})),
			setRefPos: assign((ctx, e) => {
				const { top, left } = e.ref.getBoundingClientRect();
				return { ...ctx, top, left };
			}),
			moveDraggable: assign((ctx, e) => {
				const dx = e.clientX - ctx.pointerx;
				const dy = e.clientY - ctx.pointery;
				return { ...ctx, dx, dy };
			}),
			resetDraggable: assign((ctx) => {
				return {
					...ctx,
					draggingRef: null,
					dropRef: null,
					refData: null,
					pointerx: 0,
					pointery: 0,
					dx: 0,
					dy: 0,
				};
			}),
			spawnDraggingSvcs: assign((ctx) => ({
				...ctx,
				draggingRef: spawn(draggingSvc, "dragging-svc"),
				dropRef: spawn(droppingSvc, "dropping-svc"),
			})),
			stopDraggingSvc: stop("dragging-svc"),
			stopDroppingSvc: stop("dropping-svc"),
		},
		services: {
			mouseDragInit: (ctx, e) => (callback, onRec) => {
				const { clientX: iX, clientY: iY } = e;

				const handleMouseMove = (event) => {
					const { clientX, clientY } = event;
					const x = Math.abs(iX - clientX);
					const y = Math.abs(iY - clientY);

					callback({ type: "START_DRAGGING", x, y });
				};
				window.addEventListener("mousemove", handleMouseMove);

				return () => {
					window.removeEventListener("mousemove", handleMouseMove);
				};
			},
			mouseRelease: (ctx, e) => (callback, onRec) => {
				const handleMouseUp = () => {
					callback("MOUSE_UP");
				};
				window.addEventListener("mouseup", handleMouseUp);

				return () => {
					window.removeEventListener("mouseup", handleMouseUp);
				};
			},
			draggingDraggable: (ctx, e) => (callback, onRec) => {
				const handleDragging = (event) => {
					callback(event);
				};
				window.addEventListener("mousemove", handleDragging);
				return () => {
					window.removeEventListener("mousemove", handleDragging);
				};
			},
			draggableDrop: (ctx, e) => (callback, onRec) => {
				const handleDrop = (e) => {
					callback(e);
				};
				window.addEventListener("mouseup", handleDrop);
				return () => {
					window.removeEventListener("mouseup", handleDrop);
				};
			},
		},
	}
);

let dragService = {};
export const getDragService = (group) => {
	if (dragService && dragService[group]) {
		return dragService[group];
	}
	dragService[group] = interpret(dragMachine).start();
	return dragService[group];
};

export const cleanUpDragService = (group) => {
	if (dragService && dragService[group]?.listeners.size === 0) {
		dragService[group].stop();
		delete dragService[group];

		if (Object.keys(dragService).length < 1) {
			dragService = {};
		}
	}
};
