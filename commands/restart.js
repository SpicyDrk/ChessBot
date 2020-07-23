module.exports = {
    name: 'restart',
    description: 'Stops the current puzzle', 
    execute(msg, args) {
        return {type:'restart',value:''}
    },
  };

