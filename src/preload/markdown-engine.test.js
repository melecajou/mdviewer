const { slugify } = require('./markdown-engine');

describe('slugify', () => {
  test('should lowercase text', () => {
    expect(slugify('HELLO WORLD')).toBe('hello-world');
  });

  test('should trim whitespace at the beginning and end', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });

  test('should remove HTML tags', () => {
    expect(slugify('<h1>Hello World</h1>')).toBe('hello-world');
    expect(slugify('<p>This is a <strong>test</strong></p>')).toBe('this-is-a-test');
  });

  test('should keep alphanumeric characters and accents', () => {
    expect(slugify('café')).toBe('café');
    expect(slugify('não')).toBe('não');
    expect(slugify('über')).toBe('über');
    expect(slugify('çatal')).toBe('çatal');
    expect(slugify('123abc456')).toBe('123abc456');
  });

  test('should replace spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  test('should collapse multiple spaces and hyphens', () => {
    expect(slugify('hello   world')).toBe('hello-world');
    expect(slugify('hello---world')).toBe('hello-world');
    expect(slugify('hello - world')).toBe('hello-world');
  });

  test('should remove special characters and punctuation', () => {
    expect(slugify('hello @#$%^&*() world')).toBe('hello-world');
    expect(slugify('hello, world!')).toBe('hello-world');
    expect(slugify('what?')).toBe('what');
  });
});
