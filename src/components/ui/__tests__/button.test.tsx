import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../button'

describe('Button Component', () => {
  it('renders button with default variant', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies different variants', () => {
    const { rerender } = render(<Button variant="destructive">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
    
    rerender(<Button variant="outline">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('border')
  })

  it('applies different sizes', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-9')
    
    rerender(<Button size="lg">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-11')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})