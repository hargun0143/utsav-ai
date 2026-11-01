import { formatDate } from '../utils/format.js'
import { ACCENTS } from '../utils/palette.js'

function whenLabel(daysBefore) {
  if (daysBefore === 0) return 'Event day'
  if (daysBefore === 1) return '1 day before'
  return `${daysBefore} days before`
}

/**
 * Sequential milestone countdown timeline leading up to celebration day.
 * @param {object} props - Component props.
 * @param {Array<{ daysBefore: number, date: string, task: string }>} props.items - Timeline milestone items.
 * @returns {import('react').JSX.Element}
 */
export default function Timeline({ items }) {
  return (
    <section className="plan-card" aria-labelledby="timeline-heading">
      <h3 id="timeline-heading">Countdown timeline</h3>
      <ol className="timeline">
        {items.map((item, index) => {
          const isEvent = item.daysBefore === 0
          return (
            <li
              key={`${item.date}-${index}`}
              className={isEvent ? 'timeline-item is-event' : 'timeline-item'}
              style={{ '--dot': isEvent ? '#f2a73b' : ACCENTS[index % ACCENTS.length], '--i': index }}
            >
              <span className="timeline-dot" aria-hidden="true" />
              <p className="timeline-when">
                <time dateTime={item.date}>{formatDate(item.date)}</time> · {whenLabel(item.daysBefore)}
              </p>
              <p className="timeline-task">{item.task}</p>
            </li>
          )
        })}
      </ol>
    </section>
  )
}