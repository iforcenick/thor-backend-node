#!/bin/bash

decrypt()
{
	if [ ! -f "$1.encrypted" ]
	then
		printf "%-60s   [ \033[31mNot found  \033[0m]\n" "$1"
		return 0
	fi

	if [ ! -f "$2" ]
	then
         printf "%-60s   [ \033[93mSkipped - No key \033[0m]\n" "$1"
		 return 0
	fi

	decrypted=$(openssl aes-256-cbc -d -a -in $1.encrypted -pass file:$2 2>/dev/null)
	old_file=$(cat $1 2>/dev/null)

	if [ "$decrypted" != "$old_file" ]
	then
		openssl aes-256-cbc -d -a -salt -in ${1}.encrypted -out ${1} -pass file:${2} 2>/dev/null

		if [ $? == 0 ]
		then
			printf "%-60s   [ \033[92mDecrypting\033[0m ]\n" "$1"
		else
			printf "%-60s   [ \033[91mError decrypting\033[0m ]\n" "$1"
		fi
	else
		printf "%-60s   [ No changes ]\n" "$1"
	fi
}

if [ -d "secrets" ]
then
	for file in $(find secrets -name \*.encrypted); do
		output_file=$(echo "${file}" | sed  's/\.encrypted//g')

		decrypt ${output_file} ${HOME}/.thor_api_key
	done
fi
for file in $(find kubernetes -name \*.encrypted); do
    output_file=$(echo "${file}" | sed  's/\.encrypted//g')

    decrypt ${output_file} ${HOME}/.thor_api_key
done
