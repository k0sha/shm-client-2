import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Center, Stack, Text, Button } from '@mantine/core';

interface State { hasError: boolean; }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Center h="100vh">
          <Stack align="center" gap="md">
            <Text size="lg" fw={600}>Что-то пошло не так</Text>
            <Button onClick={() => window.location.reload()}>
              Обновить страницу
            </Button>
          </Stack>
        </Center>
      );
    }
    return this.props.children;
  }
}
