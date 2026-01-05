let isAltPressed = false
let altDownAt = 0
let speed = 1.5

chrome.storage.local.get('speed', (res: { speed: number }) => {
	speed = res.speed || 1.5
})

function closestScrollable(el: Element | null) {
	if (!el) return null

	let element: Element | null = el
	while (element && element !== document.body) {
		const style = getComputedStyle(element)
		const overflowY = style.overflowY
		const isScrollable = overflowY === 'auto' || overflowY === 'scroll'

		if (isScrollable && element.scrollHeight > element.clientHeight)
			return element

		element = element.parentElement
	}

	return document.scrollingElement // fallback (html/body)
}

function handleKeyDown(event: KeyboardEvent) {
	isAltPressed = event.key === 'Alt'
	altDownAt = performance.now()
}

function handleKeyUp(event: KeyboardEvent) {
	isAltPressed = false

	const now = performance.now()
	const difference = now - altDownAt

	console.log(difference)

	event.preventDefault()
}

function onWheel(event: WheelEvent) {
	if (!isAltPressed) return
	event.preventDefault()

	const element = document.elementFromPoint(event.clientX, event.clientY)
	const target = closestScrollable(element)

	if (!target) return

	target.scrollBy({
		top: event.deltaY * speed
	})
}

window.addEventListener('keydown', handleKeyDown)
window.addEventListener('keyup', handleKeyUp)
window.addEventListener('wheel', onWheel, { passive: false })

chrome.runtime.onMessage.addListener((msg) => {
	if (msg.type === 'CHANGE_SPEED') speed = msg.speed
})
