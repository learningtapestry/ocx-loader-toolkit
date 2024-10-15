export default function absolutizeUrl(baseUrl: string, relativeUrl: string) {
  // If the relativeUrl is already an absolute URL, return it as is
  if (/^(?:[a-z]+:)?\/\//i.test(relativeUrl)) {
    return relativeUrl;
  }

  // Parse the base URL into components
  const baseElements = baseUrl.split("/");

  // If the base URL is not an absolute URL, return the relativeUrl as is
  if (baseElements.length < 3) {
    return relativeUrl;
  }

  // Remove last element of the base URL (e.g., the file or relative path)
  baseElements.pop();

  // If the relative URL starts with "./", remove it
  if (relativeUrl.startsWith("./")) {
    relativeUrl = relativeUrl.substring(2);
  }

  // If the relative URL starts with "/", append it to the base URL host
  if (relativeUrl.startsWith("/")) {
    return `${baseElements.slice(0, 3).join("/")}${relativeUrl}`;
  }

  // If the relative URL starts with "../", go up one level in the base URL path
  while (relativeUrl.startsWith("../")) {
    relativeUrl = relativeUrl.substring(3);
    baseElements.pop();
  }

  // Add the relative URL to the base URL path
  baseElements.push(relativeUrl);

  // Join the elements and form the absolutized URL
  return baseElements.join("/");
}
