import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const defaultValue = 1.5

function App() {
	const [inputValue, setInputValue] = useState<string>(defaultValue.toString())
	const [speed, setSpeed] = useState<number>(defaultValue)
	let timeout: number | null = null
	const inputRef = useRef<HTMLInputElement>(null)

	const sendMessage = useCallback((data: Record<string, unknown>) => {
		chrome.tabs
			.query({ active: true, currentWindow: true })
			.then(([tab]) => {
				if (!tab.id) return
				chrome.tabs.sendMessage(tab.id, data)
			})
			.catch(() => {
				console.warn('No hay content script en esta página')
			})
	}, [])

	const setSpeedStorage = useCallback(
		(speed: number) => {
			sendMessage({
				type: 'CHANGE_SPEED',
				speed: speed
			})
			chrome.storage.local.set({ speed: speed || defaultValue })
		},
		[sendMessage]
	)

	const getSpeedStorage = useCallback(() => {
		chrome.storage.local.get('speed', (res: { speed: string }) => {
			const speed = Number(res.speed) || defaultValue
			setSpeed(speed)
			setInputValue(speed.toString())
		})
	}, [])

	const handleInputChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value || ''
			const numberValue = Number(value)
			const isValueNaN = Number.isNaN(numberValue)

			if (timeout) clearTimeout(timeout)

			if (isValueNaN || value.trim() === '') {
				if (timeout) clearTimeout(timeout)
				timeout = setTimeout(() => {
					setInputValue(defaultValue.toString())
					setSpeed(defaultValue)
					setSpeedStorage(defaultValue)
				}, 1000)
			}

			setInputValue(value)
			setSpeed(numberValue)
			setSpeedStorage(numberValue)
		},
		[timeout, setSpeedStorage]
	)

	const handleInputScroll = useCallback(
		(event: WheelEvent) => {
			event.preventDefault()
			event.stopPropagation()
			const isUpping = event.deltaY < 0
			const simbol = isUpping ? 1 : -1
			const newSpeed = Math.round((speed + 0.1 * simbol) * 100) / 100

			if (newSpeed > 10 || newSpeed <= 0) return

			setSpeed(newSpeed)
			setInputValue(newSpeed.toString())
			setSpeedStorage(newSpeed)
		},
		[speed, setSpeedStorage]
	)

	useEffect(() => {
		if (!inputRef.current) return
		inputRef.current.addEventListener('wheel', handleInputScroll, {
			passive: false
		})

		return () => {
			if (!inputRef.current) return
			inputRef.current.removeEventListener('wheel', handleInputScroll)
		}
	}, [handleInputScroll])

	useEffect(() => {
		getSpeedStorage()
	}, [getSpeedStorage])

	return (
		<>
			<section className="w-full mx-auto flex flex-col items-center py-10 px-6 flex-1 h-full">
				<header className="flex flex-col items-center w-fit mx-auto">
					<img
						className="w-16 h-auto"
						src="/popup/logo-cm.svg"
						alt="Logo Sena"
					/>
					<h1 className="text-4xl font-bold mt-1">Fast Scroll</h1>
					<p className="text-gray-300 text-center">
						Te permite aumentar o disminuir la velocidad del scroll manteniendo
						la tecla <kbd>Alt</kbd> presionada
					</p>
				</header>
				<main className="mt-5 w-fit mx-auto">
					<label className="flex flex-col">
						<span className="text-gray-300 text-sm mb-1">Multiplicador</span>
						<input
							ref={inputRef}
							className="outline-none border border-gray-700 p-2 rounded px-2 bg-gray-800 focus:ring-1 ring-blue-800 focus:border-blue-800 text-center w-fit"
							type="text"
							value={inputValue}
							onChange={handleInputChange}
						/>
						<span
							className="text-gray-300 text-sm mt-2 w-fit ml-auto"
							title="Middle Mouse Button (MMB)">
							<kbd>MMB ↑↓</kbd>
						</span>
					</label>
				</main>
			</section>

			<footer className="w-full border-t border-gray-600 mt-auto px-4 py-4 text-center">
				<span>
					&copy; {new Date().getFullYear()} CM. Todos los derechos reservados.
				</span>
			</footer>
		</>
	)
}

export default App
