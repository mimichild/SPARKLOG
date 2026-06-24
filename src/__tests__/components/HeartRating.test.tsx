import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HeartRating from '@/components/HeartRating';

test('renders 5 hearts', async () => {
  const { getAllByText } = await render(<HeartRating value={3} themeColor="#6c63ff" />);
  expect(getAllByText('♥')).toHaveLength(5);
});

test('calls onPress with correct value when tapped', async () => {
  const onPress = jest.fn();
  const { getAllByText } = await render(
    <HeartRating value={1} themeColor="#6c63ff" onPress={onPress} />,
  );
  fireEvent.press(getAllByText('♥')[2]); // tap 3rd heart
  expect(onPress).toHaveBeenCalledWith(3);
});

test('does not call onPress when readOnly', async () => {
  const onPress = jest.fn();
  const { getAllByText } = await render(
    <HeartRating value={5} themeColor="#6c63ff" onPress={onPress} readOnly />,
  );
  fireEvent.press(getAllByText('♥')[0]);
  expect(onPress).not.toHaveBeenCalled();
});
