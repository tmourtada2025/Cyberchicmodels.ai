import { Wordmark } from './Wordmark'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <Wordmark className="footer-wordmark" />
        <p className="footer-disclosure">AI models · No real person is depicted.</p>
      </div>
    </footer>
  )
}
