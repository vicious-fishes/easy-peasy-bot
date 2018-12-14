/**
 * A Bot for Slack!
 */


/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({user: installer}, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}


/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    var BotkitStorage = require('botkit-storage-mongo');
    config = {
        storage: BotkitStorage({mongoUri: process.env.MONGOLAB_URI}),
    };
} else {
    config = {
        json_file_store: ((process.env.TOKEN)?'./db_slack_bot_ci/':'./db_slack_bot_a/'), //use a different name if an app or CI
    };
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */

if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    var customIntegration = require('./lib/custom_integrations');
    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
    var controller = customIntegration.configure(token, config, onInstallation);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var app = require('./lib/apps');
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}

getSchedule = () => {
    /* ask database for the schedule and return a list of classes, dates, times, locations*/
    return `placeholder`;
}
/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', function (bot) {
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    // you may want to attempt to re-open
});


/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!

// simple replies
controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here!")
});

controller.hears(['(H|h)ello', '(H|h)i', '(Y|y)o', '(G|g)reetings'],
    ['direct_mention', 'mention', 'direct_message', 
    function (bot, message) {
    bot.reply(message, 'The light in me recognizes and appreciates the light in you.');
});

controller.hears(['((W|w)h(o|at)).*((H|h)anuman|you)\?*'],
    ['direct_mention', 'mention', 'direct_message', 
    function (bot, message) {
    bot.reply(message, 'I am a bot named after the 11th incarnation of Shiva, Hanuman. Here is a link to his Wikipedia page: https://en.wikipedia.org/wiki/Hanuman');
});

controller.hears(['(N|n)amaste'],
    ['direct_mention', 'mention', 'direct_message', 
    function (bot, message) {
    bot.reply(message, 'Namaste. :peace_symbol:');
});

controller.hears(['(O|o)h*m+'],
    ['direct_mention', 'mention', 'direct_message', 
    function (bot, message) {
    bot.reply(message, 'Om shanthi om... :peace_symbol:');
});

// questions and answers

controller.hears(['((W|w)hen|(W|w)here|(W|w)hat).* (class|practice|session)[?]*',
    '(S|s)chedule'],
    ['direct_mention', 'mention', 'direct_message', 
    function (bot, message) {
        let classSchedule = getSchedule();
        bot.reply(message, `Here is the list of our upcoming scheduled group practices: \`\`\`${classSchedule}\`\`\``);
});

controller.hears(['(R|r)egister'],
    ['direct_mention', 'mention', 'direct_message',
    function (bot, message) {
        let classSchedule = getSchedule();
        let class_selection_info = '';

        bot.createConversations(message, function(err, convo) {

            convo.addQuestion(
                `Which class should I sign you up for? Please select an option by number, i.e. "1" or "one". To see the class schedule again, choose "list".`,
                [{
                    pattern: ['1', '(O|o)ne'],
                    callback: function(response, convo) {
                        class_selection_info = classSchedule[0];
                        convo.gotoThread('registration_confirmation');
                    },

                },
                {
                    pattern: ['2', '(T|t)wo'],
                    callback: function(response, convo) {
                        class_selection_info = classSchedule[1];
                        convo.gotoThread('registration_confirmation');
                    },

                },
                {
                    pattern: ['3', '(T|t)hree'],
                    callback: function(response, convo) {
                        class_selection_info = classSchedule[2];
                        convo.gotoThread('registration_confirmation');
                    },

                },
                {
                    pattern: ['4', '(F|f)our'],
                    callback: function(response, convo) {
                        class_selection_info = classSchedule[3];
                        convo.gotoThread('registration_confirmation');
                    },

                },
                {
                    pattern: ['5', '(F|f)ive'],
                    callback: function(response, convo) {
                        class_selection_info = classSchedule[4];
                        convo.gotoThread('registration_confirmation');
                    },

                },
                {
                    pattern: '(L|l)ist',
                    callback: function(response, convo) {
                        bot.reply(message, `Here is the list of our upcoming scheduled group practices: \`\`\`${classSchedule}\`\`\``);
                        convo.gotoThread('yes_group');
                    },

                }],
                {},
                'yes_group');

            convo.addQuestion(
                `You selected \`\`\`${class_selection_info}\`\`\` Should I go ahead and register you?}`,
                [{
                    pattern: 'yes',
                    callback: function(response, convo) {
                        /* do some stuff to add this person to the list of registered people */
                        convo.gotoThread('successfully_registered');
                    },
                },
                {
                    pattern: 'no',
                    callback: function(response, convo) {
                        bot.reply(message, `Okay, I didn't register you.`)
                        convo.gotoThread('default');
                    },
                }],
                {},
                'registration_confirmation'
            );

            convo.addQuestion(
                `You've been successfully registered! Would you like to register for another class?`,
                [{
                    pattern: 'yes',
                    callback: function(response, convo) {
                        convo.gotoThread('default');
                    },
                },
                {
                    pattern: 'no',
                    callback: function(response, convo) {
                        bot.reply(`Okie dokie.`);
                    }


                }],
                {},
                'successfully_registered'
            );

            convo.addQuestion(
                `Here is the list of our upcoming scheduled group practices: \`\`\`${classSchedule}\`\`\` Would you like to register for one of these?`, 
                [{
                    pattern: 'yes',
                    callback: function(response, convo) {
                        convo.gotoThread('yes_group');
                    },
                },
                {
                    pattern: 'no',
                    callback: function(response, convo) {
                        convo.gotoThread('no_group');
                    },
                },
                {
                    default: true,
                    callback: function(response, convo) {
                        convo.gotoThread('bad_response');
                    },
                }],
                {},
                'default'
            );
        })
    });
/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
//controller.on('direct_message,mention,direct_mention', function (bot, message) {
//    bot.api.reactions.add({
//        timestamp: message.ts,
//        channel: message.channel,
//        name: 'robot_face',
//    }, function (err) {
//        if (err) {
//            console.log(err)
//        }
//        bot.reply(message, 'I heard you loud and clear boss.');
//    });
//});
