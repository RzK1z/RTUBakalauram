import React from 'react';
import { Text } from 'react-native';

const Highlighter = ({ text, searchText }) => {
  if (!searchText) {
    return <Text>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${searchText})`, 'gi'));

  return (
    <Text>
      {parts.map((part, index) =>
        part.toLowerCase() === searchText.toLowerCase() ? (
          <Text key={index} style={{ backgroundColor: 'yellow' }}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

export default Highlighter;