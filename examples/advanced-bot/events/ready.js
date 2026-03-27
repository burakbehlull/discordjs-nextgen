const readyEvent = {
  name: 'ready',
  run: (user) => {
    console.log(`${user.tag} hazır!`);
  }
};

export default readyEvent;