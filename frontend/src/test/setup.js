import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView — provide a no-op so tests don't throw
window.HTMLElement.prototype.scrollIntoView = function () {};
