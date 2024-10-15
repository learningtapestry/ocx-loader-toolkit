export default function randomUUID() {
  // Generate a random number in the range of 0 to 15 for each character in the UUID
  const randomChar = () => Math.floor(Math.random() * 16).toString(16);

  // Concatenate the random numbers to form the UUID
  const uuid = `${randomChar()}${randomChar()}${randomChar()}${randomChar()}-${randomChar()}${randomChar()}-${randomChar()}${randomChar()}${randomChar()}${randomChar()}-${randomChar()}${randomChar()}${randomChar()}${randomChar()}-${randomChar()}${randomChar()}${randomChar()}${randomChar()}${randomChar()}${randomChar()}`;

  return uuid;
};
