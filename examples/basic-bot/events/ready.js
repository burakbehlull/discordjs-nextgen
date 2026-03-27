const readyEvent = {
  name: 'ready',
  run: (user) => {
    console.log(`${user.tag} adlı bot hazır!`);
  }
};

export default readyEvent;