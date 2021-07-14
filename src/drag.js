import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useActor } from "@xstate/react";
import { getDragService, cleanUpDragService } from "./machine/machine";
import "./drag.css";

export function Drag({
	children,
	group,
	draggable,
	dropArea,
	data,
	onDragAreaEnter,
	onDragAreaLeave,
	onDragAreaDrop,
	onStateChange,
	className,
	...props
}) {
	const [state, send] = useActor(getDragService(group));
	const draggableEl = useRef(null);
	const [coords, setCoords] = useState({ dx: 0, dy: 0 });

	useEffect(() => {
		return () => {
			cleanUpDragService(group);
		};
	}, [group]);

	useEffect(() => {
		if (state.context.ref === draggableEl.current) {
			const { dx, dy } = state.context;
			setCoords({ dx, dy });
		}
	}, [state.context]);

	useEffect(() => {
		onStateChange && onStateChange(state.value);
	}, [state.value, onStateChange]);

	useEffect(() => {
		if (state.context.ref === draggableEl.current) {
			send({ type: "SET_REF_DATA", data });
		}
	}, [data, send, state.context.ref]);

	const isDragRef = () => {
		return state.context.ref === draggableEl.current;
	};

	const isDragging = () =>
		isDragRef() && ["dragging", "inDropArea"].includes(state.value);

	const notIdle = () => state.value !== "idle";
	const mouseDownHandler = (e) => {
		e.preventDefault();
		send({ ...e, ref: draggableEl.current, data });
	};

	const mouseEnterHandler = () => {
		if (!isDragRef()) {
			send("ENTER_DROP_AREA");
			onDragAreaEnter && onDragAreaEnter(state.context.refData);
		}
	};
	const mouseLeaveHandler = () => {
		if (!isDragRef()) {
			send("LEAVE_DROP_AREA");
			onDragAreaLeave && onDragAreaLeave(state.context.refData);
		}
	};
	const mouseUpHandler = () => {
		if (!isDragRef()) {
			onDragAreaDrop && onDragAreaDrop(state.context.refData);
		}
	};

	const dragInPortal = (top, left) => {
		const portal = document.getElementById("portal");
		return createPortal(
			<div
				style={{
					transform: "translate(calc(var(--dx) * 1px), calc(var(--dy) * 1px))",
					"--dx": coords.dx,
					"--dy": coords.dy,
					position: "absolute",
					top,
					left,
					pointerEvents: "none",
				}}
				className="draggable-portal-wrapper"
				data-state={state.value}
			>
				{children}
			</div>,
			portal
		);
	};

	return (
		<>
			{isDragging()
				? dragInPortal(state.context.top, state.context.left)
				: null}
			<div
				ref={draggableEl}
				className={`drag-xstate-draggable ${className ? className : ""}`}
				data-state={
					state.context.ref === draggableEl.current ? state.value : ""
				}
				onMouseDown={draggable ? mouseDownHandler : undefined}
				onMouseEnter={dropArea && notIdle() ? mouseEnterHandler : undefined}
				onMouseLeave={dropArea && notIdle() ? mouseLeaveHandler : undefined}
				onMouseUp={dropArea && notIdle() ? mouseUpHandler : undefined}
				{...props}
			>
				{children}
			</div>
		</>
	);
}
