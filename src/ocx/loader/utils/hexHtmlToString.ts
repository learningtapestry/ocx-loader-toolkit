const HEX_REGEX = /&#x([a-fA-F0-9]+);/g;

export default function hexHtmlToString(value: string) {
  return value.replace(HEX_REGEX, (_match, hex) => (
    String.fromCharCode(parseInt(hex, 16))
  ));
}
