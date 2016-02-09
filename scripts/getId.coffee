#  Description
#    Get conversationId
#
#  Commands:
#    please id
module.exports = (robot) ->
  robot.hear /please id/i, (msg) ->
    msg.send "conversationId is #{msg.message.user.options.conversationId}"