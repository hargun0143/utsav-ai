import { ACCENTS } from '../utils/palette.js'

export default function IdeasGrid({ ideas }) {
  return (
    <section className="plan-card" aria-labelledby="ideas-heading">
      <h3 id="ideas-heading">Ideas to make it yours</h3>
      <ul className="ideas">
        {ideas.map((idea, index) => (
          <li
            key={`${idea.title}-${index}`}
            className="idea"
            style={{ '--accent': ACCENTS[index % ACCENTS.length], '--i': index }}
          >
            <span className="idea-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <h4>{idea.title}</h4>
            <p>{idea.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}