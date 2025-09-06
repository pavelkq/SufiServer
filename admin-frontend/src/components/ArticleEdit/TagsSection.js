import React from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';

const TagsSection = ({ tags, selectedTags, onTagToggle, loading }) => {
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Темы статьи
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {tags?.map(tag => (
          <Chip
            key={tag.id}
            label={tag.name}
            onClick={() => !loading && onTagToggle(tag.id)}
            color={selectedTags.includes(tag.id) ? 'primary' : 'default'}
            variant={selectedTags.includes(tag.id) ? 'filled' : 'outlined'}
            disabled={loading}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TagsSection;
