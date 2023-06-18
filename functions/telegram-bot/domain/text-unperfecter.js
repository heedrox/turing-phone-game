function makeResponseLessPerfect(message) {
    let modifiedMessage = message.split('');
  
    for (let i = 0; i < modifiedMessage.length; i++) {
      if (modifiedMessage[i] === ' ' && Math.random() < 0.0005) {
        modifiedMessage[i] = '';
      } else if (/[.,?!]/.test(modifiedMessage[i]) && Math.random() < 0.05) {
        modifiedMessage[i] = modifiedMessage[i] + ' ';
      } else if (/[¡¿]/.test(modifiedMessage[i]) && Math.random() < 0.25) {
        modifiedMessage[i] =''
      } else if (modifiedMessage[i] === '!' && Math.random() < 0.05) {
        modifiedMessage[i] = '';
      } else if (/[A-Z]/.test(modifiedMessage[i]) && Math.random() < 0.10) {
        modifiedMessage[i] = modifiedMessage[i].toLowerCase();
      } else if (Math.random() < 0.00005) {
        const randomChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        modifiedMessage[i] = randomChar;
      }
    }
  
    if (modifiedMessage[modifiedMessage.length - 1] === '.' && Math.random() < 0.3) {
      modifiedMessage.pop();
    }
  
    modifiedMessage = modifiedMessage.join('');
  
    return modifiedMessage;
  }

exports.textUnperfecter = {
    create: () => ({
        unperfect: (txt) => makeResponseLessPerfect(txt)
    })
}