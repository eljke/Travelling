import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }
  render() {
    return this.state.failed ? (
      <main className="container empty">
        <h1>Не удалось открыть страницу</h1>
        <p>Попробуйте перезагрузить страницу. Сохранённые места останутся в браузере.</p>
        <button className="button secondary" onClick={() => window.location.reload()}>
          Перезагрузить
        </button>
        <a href="#/">К путешествиям</a>
      </main>
    ) : (
      this.props.children
    )
  }
}
