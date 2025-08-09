import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'

describe('Card Components', () => {
  it('renders Card component', () => {
    render(<Card data-testid="card">Test Card</Card>)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('renders CardHeader component', () => {
    render(<CardHeader data-testid="card-header">Header</CardHeader>)
    expect(screen.getByTestId('card-header')).toBeInTheDocument()
  })

  it('renders CardTitle component', () => {
    render(<CardTitle data-testid="card-title">Title</CardTitle>)
    expect(screen.getByTestId('card-title')).toBeInTheDocument()
  })

  it('renders CardDescription component', () => {
    render(<CardDescription data-testid="card-description">Description</CardDescription>)
    expect(screen.getByTestId('card-description')).toBeInTheDocument()
  })

  it('renders CardContent component', () => {
    render(<CardContent data-testid="card-content">Content</CardContent>)
    expect(screen.getByTestId('card-content')).toBeInTheDocument()
  })

  it('renders CardFooter component', () => {
    render(<CardFooter data-testid="card-footer">Footer</CardFooter>)
    expect(screen.getByTestId('card-footer')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<Card className="custom-class" data-testid="card">Test</Card>)
    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })
})