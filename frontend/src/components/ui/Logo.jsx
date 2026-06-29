import smritiLogo from '../../assets/smriti-logo.svg'

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <img src={smritiLogo} alt="Smriti Logo" className={className} />
  )
}
