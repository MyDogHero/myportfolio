/*
 * The loading screen is part of index.html, so it shows the moment the page
 * starts to arrive. A small script there counts up while the site downloads;
 * these helpers move the count on as the room is built, then lift the screen.
 */
type Boot = { set: (value: number) => void; done: () => void };

const screen = () => (window as unknown as { __boot?: Boot }).__boot;

export const bootProgress = (value: number) => screen()?.set(value);
export const bootDone = () => screen()?.done();
