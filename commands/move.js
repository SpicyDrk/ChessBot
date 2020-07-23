

module.exports = {
    name: 'move',
    description: 'Imput for a chess move/guess', //i.e. move d2h2
    execute(msg, args) {
        if (args.length != 1){
            msg.channel.send('nah qtbutt')
        } else {
            //console.log(args)
        }
        return {type:'move',value:args[0]}
    },
  };

