import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MiniTest } from '@/components/MiniTest'

jest.mock('@/lib/actions', () => ({
  recordMiniTest: jest.fn(async () => ({ correct: 2, total: 2, passed: true, firstCompletion: true })),
}))

const questions = [
  { id: 'a', text: 'Prima domanda?', options: ['Giusta', 'Sbagliata'], answer: 0, explanation: 'Perché sì.' },
  { id: 'b', text: 'Seconda domanda?', options: ['No', 'Sì'], answer: 1, explanation: 'Spiegazione due.' },
]

const setup = () =>
  render(
    <MiniTest
      subjectId="storia" unitId="u1" moduleId="m1" heading="Modulo" eyebrow="Mini test"
      questions={questions} lessonHref="/l" nextHref="/n" nextLabel="Avanti al modulo 2"
    />,
  )

it('corregge subito ogni domanda e alla fine mostra il risultato', async () => {
  const user = userEvent.setup()
  setup()
  expect(screen.getByRole('button', { name: 'Controlla' })).toBeDisabled()

  await user.click(screen.getByRole('button', { name: /Sbagliata/ }))
  await user.click(screen.getByRole('button', { name: 'Controlla' }))
  expect(screen.getByText('Non è questa.')).toBeInTheDocument()
  expect(screen.getByText('Perché sì.', { exact: false })).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Domanda successiva' }))
  await user.click(screen.getByRole('button', { name: /Sì/ }))
  await user.click(screen.getByRole('button', { name: 'Controlla' }))
  expect(screen.getByText('Giusto.')).toBeInTheDocument()

  await user.click(screen.getByRole('button', { name: 'Vedi il risultato' }))
  expect(await screen.findByText(/modulo completato/)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Avanti al modulo 2' })).toHaveAttribute('href', '/n')
})
