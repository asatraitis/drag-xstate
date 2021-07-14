## Quick Start

```bash
npm i drag-xstate
```

### Portal Element

drag-xstate uses react portal to drag elements outside the influence of parent element (overflow, positions). Need to add an element with an id **portal**:

```html
<body>
	<noscript>You need to enable JavaScript to run this app.</noscript>
	<div id="root"></div>
	<!-- React root el -->
	<div id="portal"></div>
	<!-- Portal el -->
</body>
```

### Example

#### JS

```js
import "./App.css";
import { useState } from "react";
import { Drag } from "drag-xstate";

function App() {
	const [total, setTotal] = useState(0);
	return (
		<div className="App">
			<header className="App-header">
				<Drag group="A" draggable data={1}>
					<span className="drag-number">1</span>
				</Drag>
				<Drag group="A" draggable data={2}>
					<span className="drag-number">2</span>
				</Drag>
				<Drag group="A" draggable data={5}>
					<span className="drag-number">5</span>
				</Drag>
				<Drag group="A" draggable data={10}>
					<span className="drag-number">10</span>
				</Drag>
				<Drag
					group="A"
					dropArea
					onDragAreaDrop={(data) => {
						setTotal((currTotal) => currTotal + data);
					}}
				>
					<div className="total">{total}</div>
				</Drag>
			</header>
		</div>
	);
}
```

#### CSS

```css
.drag-number {
	color: white;
	font-size: 24px;
}
.total {
	width: 250px;
	height: 250px;
	border: 1px dashed white;
	display: flex;
	justify-content: center;
	align-items: center;
}
```

Example above allows user to drag draggable spans and drop onto the `<Drag dropArea>` wrapped content and adding the number that passed into draggable elements data prop.

### Props

#### group : string

```jsx
<Drag  group="A">
```

drag-xstate maintains Xstate machine instances in an object. Providing different groups will make draggable and dropArea content to be exclusive to that specific group. For example, `group="A"` wrapped content will not be able interact with `group="B"` wrapped content.

#### draggable : boolean

```jsx
<Drag  group="A" draggable>
```

Enables the content to be draggable.
❗❗❗ Since the content will be rendered outside the scope of the parent elements (portal), be sure that styles of that element aren't affected. Prefer to style the element directly instead of inheriting from parent elements.

#### data : any

```jsx
<Drag group="A" draggable data={1}>
```

data prop contains data that will be used for dropping, entering and leaving a `dropArea` wrapped content.

#### dropArea : boolean

Enables wrapped content to be used with `onDragAreaEnter`, `onDragAreaLeave`, and `onDragAreaDrop`.

#### onDragAreaEnter, onDragAreaLeave, onDragAreaDrop : function(data)

Props that fire when entering, leaving and dropping draggable item on the `dragArea` wrapped content. data argument of the callback fx contains data passed in the currently dragging items `data` prop.
