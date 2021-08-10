import path from 'path';
import fs from 'fs';
import {CronJob} from 'cron';
import dotenv from 'dotenv';
import {spawn} from 'child_process';
import {ManagedUpload} from 'aws-sdk/lib/s3/managed_upload';

import {fileName, logger, MessageType, UploadBackupDataToS3} from './helpers';
import SendData = ManagedUpload.SendData;
import ErrnoException = NodeJS.ErrnoException;

class MongoBkp {

    constructor() {
        dotenv.config();
    }

    // mongodump --archive=test.20150715.gz --gzip --db=smartsoul_04_june_2021
    // mongorestore --gzip -v --archive=test.20150715.gz --nsInclude="smartsoul_04_june_2021.*"

    private BACKUP_TARGET_ENV = process.env.NODE_ENV;

    private cronJob: CronJob;

    private executeBackupCommands(): void {
        const FILE_NAME = `${fileName()}.gz`;
        const BACKUP_DIR = path.join(__dirname, '../backups', `${FILE_NAME}`);

        const backupProcess = spawn('mongodump', [
            `--db=${process.env.DB_NAME_LOCAL}`,
            `--archive=${BACKUP_DIR}`,
            '--gzip'
        ]);

        backupProcess.on('exit', (code, signal) => {
            if (code) {
                logger(MessageType.warn, '\n Backup process exited with code ', code);
            } else if (signal) {
                logger(MessageType.error, '\n Backup process was killed with signal ', signal);
            } else {
                logger(MessageType.success, '\n Successfully backed-up the database ✅ ');
                logger(MessageType.info, '\n Started uploading to S3...');

                /* Upload backup to S3 bucket */
                fs.readFile(BACKUP_DIR, (err: ErrnoException, data: Buffer) => {
                    if (err) {
                        throw err;
                    }

                    const base64data = Buffer.from(data);
                    UploadBackupDataToS3(process.env.S3_BUCKET_DB_BACKUP_LOCAL, FILE_NAME, base64data)
                        .then((res: SendData) => {
                            logger(MessageType.success, '\n Backup uploaded to S3 successfully', res.Location);

                            /* Delete backup file from local */
                            logger(MessageType.info, '\n Deleting backup file from local machine');
                            try {
                                fs.unlinkSync(BACKUP_DIR);
                                logger(MessageType.success, '\n Backup file deleted from local machine');
                            } catch (err) {
                                console.error(err);
                            }
                        }).catch(error => {
                        logger(MessageType.error, '\n Backup upload failed', error);
                    });
                });
            }
        });
    }

    public takeMongoBackup(): void {
        this.cronJob = new CronJob('10 * * * * *', async () => {
            try {
                await this.executeBackupCommands();
            } catch (e) {
                console.error(e);
            }
        });

        // Start job
        if (!this.cronJob.running) {
            this.cronJob.start();
        }
        logger(MessageType.info, 'App Started...');
    }
}

const mongoBkp = new MongoBkp();
mongoBkp.takeMongoBackup();
