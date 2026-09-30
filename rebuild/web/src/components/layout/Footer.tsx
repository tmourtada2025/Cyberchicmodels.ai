import { Wordmark } from './Wordmark'

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-wordmark">
          <Wordmark />
        </div>
        <p className="footer-disclosure">AI models · No real person is depicted.</p>
      </div>
    </footer>
  )
}
