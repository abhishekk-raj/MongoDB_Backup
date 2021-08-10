import path from 'path';
import {CronJob} from 'cron';
import dotenv from 'dotenv';
import {spawn} from 'child_process';

import {fileName, logger, MessageType} from './helpers';

class MongoBkp {

    constructor() {
        dotenv.config();
    }

    // mongodump --archive=test.20150715.gz --gzip --db=smartsoul_04_june_2021
    // mongorestore --gzip -v --archive=test.20150715.gz --nsInclude="smartsoul_04_june_2021.*"
    private FILE_NAME = `${fileName()}.gz`;
    private BACKUP_DIR = path.join(__dirname, '../backups', `${this.FILE_NAME}`);

    private BACKUP_TARGET_ENV = process.env.NODE_ENV;

    private cronJob: CronJob;

    private executeBackupCommands(): void {
        const backupProcess = spawn('mongodump', [
            `--db=${process.env.DB_NAME_LOCAL}`,
            `--archive=${this.BACKUP_DIR}`,
            '--gzip'
        ]);

        backupProcess.on('exit', (code, signal) => {
            if (code)
                logger(MessageType.warn, 'Backup process exited with code ', code);
            else if (signal)
                logger(MessageType.error, 'Backup process was killed with signal ', signal);
            else {
                logger(MessageType.success, 'Successfully backed-up the database ✅ ');
                // TODO: Upload zipped data to S3 bucket
                // TODO: Remove backup file locally
                // TODO: Remove S3 bucket file older than 10days
                // TODO: Send backup confirmation email
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
